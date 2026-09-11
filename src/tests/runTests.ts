import { runHealthBridgeTestSuite } from './triage.test';

async function main() {
  console.log('\n🏥 [HealthBridge PromptWars Test Suite] Starting automated verification...\n');

  try {
    const report = await runHealthBridgeTestSuite();

    let currentSuite = '';
    for (const res of report.results) {
      if (res.suite !== currentSuite) {
        currentSuite = res.suite;
        console.log(`\n📦 Suite: ${currentSuite}`);
      }
      const icon = res.passed ? '✅' : '❌';
      console.log(`  ${icon} ${res.name} (${res.durationMs}ms)`);
      if (res.error) {
        console.error(`     Error: ${res.error}`);
      }
    }

    console.log('\n========================================');
    console.log(`📊 Test Summary: ${report.passed}/${report.total} Passed (${report.failed} failed) in ${report.durationMs}ms`);
    console.log('========================================\n');

    if (report.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test runner fatal crash:', err);
    process.exit(1);
  }
}

main();
