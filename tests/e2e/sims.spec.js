import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await markVisited(page);
  await page.goto('/?lite=1');
});

test.describe('Argus simulation', () => {
  test('injecting an anomaly flags one account and says so in text', async ({ page }) => {
    const sim = page.locator('[data-sim="argus"]');
    await expect(sim.locator('canvas')).toBeVisible();
    await expect(sim.locator('.sim__static')).toBeHidden();
    await expect(sim.locator('.sim__outcome')).toContainText('No account stands out');
    await sim.getByRole('button', { name: 'Inject anomaly' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText(
      /Flagged A-\d\d: \d+ transactions inside 6 hours/,
    );
    await expect(sim.locator('.argus__list')).toContainText('FLAGGED');
    await expect(sim.locator('canvas')).toHaveAttribute('aria-label', /1 flagged/);
  });

  test('keyboard: the account buttons select an account and Reset clears the flag', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="argus"]');
    await sim.getByRole('button', { name: 'Inject anomaly' }).focus();
    await page.keyboard.press('Enter');
    const first = sim.locator('.argus__list button').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(sim.locator('.argus__detail')).toContainText(/flagged/);
    await sim.getByRole('button', { name: 'Reset' }).click();
    await expect(sim.locator('canvas')).toHaveAttribute('aria-label', /0 flagged/);
  });
});

test.describe('BlackWater simulation', () => {
  test('a private incident changes the internal view but not the public page', async ({ page }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await expect(sim.locator('.sim__static')).toBeHidden();
    await sim.getByRole('button', { name: 'Declare incident' }).click();
    const internal = sim.locator('section[aria-label="Internal view"]');
    const publicPage = sim.locator('section[aria-label="Public status page"]');
    await expect(internal).toContainText('major outage');
    await expect(publicPage).not.toContainText('major outage');
    await expect(sim.locator('.sim__outcome')).toContainText('incident is private');
    await sim.getByRole('button', { name: 'Private' }).click();
    await expect(publicPage).toContainText('major outage');
  });

  test('the lifecycle refuses moves that are not in the table and writes an audit entry for real ones', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await sim.getByRole('button', { name: 'Declare incident' }).click();
    // The button is aria-disabled but still clickable, so the visitor can see the refusal.
    await sim.getByRole('button', { name: 'CLOSED' }).click({ force: true });
    await expect(sim.locator('.sim__outcome')).toHaveText(
      'Refused: Invalid state transition from TRIGGERED to CLOSED.',
    );
    await expect(sim.locator('.bw__audit li')).toHaveCount(1);
    await sim.getByRole('button', { name: 'ACKNOWLEDGED' }).click();
    await expect(sim.locator('.bw__audit li')).toHaveCount(2);
    await expect(sim.locator('.bw__audit li').last()).toContainText('TRIGGERED to ACKNOWLEDGED');
    await expect(sim.locator('.chip').first()).toHaveText('ACKNOWLEDGED');
  });

  test('keyboard focus stays on the control after it is used', async ({ page }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await sim.getByRole('button', { name: 'Declare incident' }).focus();
    await page.keyboard.press('Enter');
    await expect(sim.getByRole('button', { name: 'Declare incident' })).toBeFocused();
    const acknowledge = sim.getByRole('button', { name: 'ACKNOWLEDGED' });
    await acknowledge.focus();
    await page.keyboard.press('Enter');
    await expect(sim.locator('.chip').first()).toHaveText('ACKNOWLEDGED');
    // The pressed button is gone (it became the current status), so focus moved to a control in the same simulation.
    const stillInside = await page.evaluate(
      () => document.activeElement?.closest('[data-sim]') !== null,
    );
    expect(stillInside).toBe(true);
  });
});

for (const size of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test(`axe finds no violations with both simulations in use at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const bw = page.locator('[data-sim="blackwater"]');
    await bw.getByRole('button', { name: 'Declare incident' }).click();
    await bw.getByRole('button', { name: 'ACKNOWLEDGED' }).click();
    await page
      .locator('[data-sim="argus"]')
      .getByRole('button', { name: 'Inject anomaly' })
      .click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}

test.describe('BeetleJuice simulation', () => {
  test('self-approval is refused, a second supervisor can approve, and the audit log shows it', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="beetlejuice"]');
    await expect(sim.locator('.sim__static')).toBeHidden();
    await expect(sim.locator('table')).toContainText('AMOUNT_MISMATCH');
    await sim.getByLabel('Note').fill('Ledger typed 1,200 instead of 1,250.');
    await sim.getByRole('button', { name: 'Propose' }).click();
    await expect(sim.locator('.chip').first()).toHaveText('pending_review');

    // Asha is the maker. The role rule stops an analyst deciding.
    await sim.getByRole('button', { name: 'Approve' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText(
      'Only supervisors can decide a proposal.',
    );

    // A different person, a supervisor, approves it.
    await sim.getByLabel('Acting as').selectOption('ravi');
    await sim.getByRole('button', { name: 'Approve' }).click();
    await expect(sim.locator('.chip').first()).toHaveText('resolved');
    await expect(sim.locator('.bw__audit')).toContainText('proposal.approved');
  });

  test('a supervisor approving their own proposal is blocked and the block is audited', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="beetlejuice"]');
    await sim.getByLabel('Let supervisors propose too').check();
    await sim.getByLabel('Acting as').selectOption('ravi');
    await sim.getByLabel('Note').fill('Correct the ledger, see the bank file.');
    await sim.getByRole('button', { name: 'Propose' }).click();
    await sim.getByRole('button', { name: 'Approve' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText(
      'Refused: You cannot approve or reject a resolution you proposed.',
    );
    await expect(sim.locator('.bw__audit')).toContainText('proposal.self_decision_blocked');
    await sim.getByLabel('Acting as').selectOption('meera');
    await sim.getByRole('button', { name: 'Approve' }).click();
    await expect(sim.locator('.chip').first()).toHaveText('resolved');
  });
});

test.describe('deadLetter simulation', () => {
  test('deadLetter blocks the injected send and still completes the task', async ({ page }) => {
    const sim = page.locator('[data-sim="deadletter"]');
    await expect(sim.locator('.sim__static')).toBeHidden();
    await sim.getByLabel('Scenario').selectOption('forward-inbox');
    await sim.getByRole('button', { name: 'Run' }).click();
    await expect(sim.locator('.dl__steps')).toContainText('untrusted_destination_private_data');
    await expect(sim.locator('.verdict--deny')).toHaveCount(1);
    await expect(sim.locator('.sim__outcome')).toContainText(
      'The attack failed. Your task still completed.',
    );
  });

  test('no defence lets the attack through and session taint blocks your own task', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="deadletter"]');
    await sim.getByRole('radio', { name: /No defence/ }).check();
    await sim.getByRole('button', { name: 'Run' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('The attack worked');
    await sim.getByRole('radio', { name: /Session taint/ }).check();
    await sim.getByRole('button', { name: 'Run' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('Your task did not complete');
  });

  test('the swapped address asks a question, and the misleading summary gets through', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="deadletter"]');
    await sim.getByLabel('Scenario').selectOption('swapped-address');
    await sim.getByRole('button', { name: 'Run' }).click();
    await expect(sim.locator('.dl__card')).toContainText('The run paused and asked you');
    await sim.getByRole('button', { name: 'Approve the send' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('The attack worked');
    await sim.getByLabel('Scenario').selectOption('misleading');
    await sim.getByRole('button', { name: 'Run' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('does not claim to stop this one');
  });
});

for (const size of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test(`axe finds no violations with the BeetleJuice and deadLetter simulations in use at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const bj = page.locator('[data-sim="beetlejuice"]');
    await bj.getByLabel('Note').fill('Correct the ledger, see the bank file.');
    await bj.getByRole('button', { name: 'Propose' }).click();
    const dl = page.locator('[data-sim="deadletter"]');
    await dl.getByLabel('Scenario').selectOption('swapped-address');
    await dl.getByRole('button', { name: 'Run' }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}

test.describe('theRedArmy simulation', () => {
  test('a shortened prompt regresses seven cases and fails the gate', async ({ page }) => {
    const sim = page.locator('[data-sim="theredarmy"]');
    await expect(sim.locator('.sim__static')).toBeHidden();
    await sim.getByRole('button', { name: 'Run suite' }).click();
    await expect(sim.locator('.ra__gate')).toContainText('PASSED');
    await sim.getByRole('button', { name: 'Shorten the prompt' }).click();
    await sim.getByRole('button', { name: 'Save as new version' }).click();
    await expect(sim.locator('.sim__outcome')).toHaveText('Saved as version 2.');
    await sim.getByRole('button', { name: 'Run suite' }).click();
    await expect(sim.locator('.ra__gate')).toContainText(
      'FAILED. 7 case(s) regressed against the baseline',
    );
    await expect(sim.locator('tbody tr')).toHaveCount(8);
    await expect(sim.locator('tbody td', { hasText: 'regressed' })).toHaveCount(7);
  });

  test('saving an unchanged prompt is refused', async ({ page }) => {
    const sim = page.locator('[data-sim="theredarmy"]');
    await sim.getByRole('button', { name: 'Save as new version' }).click();
    await expect(sim.locator('.sim__outcome')).toHaveText(
      'Nothing changed, so there is no new version.',
    );
  });
});

test.describe('Europa simulation', () => {
  test('the review queue shows each pair once, highest priority first', async ({ page }) => {
    const sim = page.locator('[data-sim="europa"]');
    await expect(sim.locator('.eu__event')).toHaveCount(4);
    await expect(sim.locator('.eu__event').first()).toContainText('CRITICAL');
    await expect(sim.locator('.eu__event').first()).toContainText('listed 2 times, shown once');
  });

  test('editing one log line breaks the chain at that entry, and restoring fixes it', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="europa"]');
    await expect(sim.locator('.eu__entry')).toHaveCount(5);
    await sim.getByRole('button', { name: 'Verify chain' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('Chain intact: 5 entries');
    const note = sim.getByLabel('Note for entry 3');
    await note.fill('Nothing to see here.');
    await note.press('Tab');
    await expect(sim.locator('.sim__outcome')).toContainText(
      'Entry hash verification failed at sequence 3',
    );
    await expect(sim.locator('.eu__entry--broken')).toHaveCount(1);
    await sim.getByRole('button', { name: 'Restore the log' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText('Log restored');
    await expect(sim.locator('.eu__entry--broken')).toHaveCount(0);
  });

  test('appending an entry keeps the chain valid', async ({ page }) => {
    const sim = page.locator('[data-sim="europa"]');
    await sim.getByLabel('Reason').fill('Checked the new report.');
    await sim.getByRole('button', { name: 'Append entry' }).click();
    await expect(sim.locator('.eu__entry')).toHaveCount(6);
    await expect(sim.locator('.sim__outcome')).toContainText('Chain intact: 6 entries');
  });
});

for (const size of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test(`axe finds no violations with theRedArmy and Europa in use at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const ra = page.locator('[data-sim="theredarmy"]');
    await ra.getByRole('button', { name: 'Shorten the prompt' }).click();
    await ra.getByRole('button', { name: 'Save as new version' }).click();
    await ra.getByRole('button', { name: 'Run suite' }).click();
    const eu = page.locator('[data-sim="europa"]');
    const note = eu.getByLabel('Note for entry 2');
    await note.fill('Edited.');
    await note.press('Tab');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}
