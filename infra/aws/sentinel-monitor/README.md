# Production rotating sentinel

The existing AWS EventBridge Scheduler resource `certscore-sentinel-hourly`
retains its name/ARN but runs at :00, :20 and :40 UTC. Each invocation submits
one fresh scan, rotating the five owned sentinel pages, three scan locations
and three submission labels. A 45-slot cycle covers all combinations in 15 hours.
The SDK label still exercises REST with a client header, not the SDK library.

## Delivery and coverage

Scheduler injects its scheduled timestamp. Events older than 180 seconds,
future events and legacy events without a timestamp are skipped. A conditional
DynamoDB slot lock prevents repeated delivery from creating another scan.
The 180-second delivery allowance plus the existing 900-second Lambda timeout
fits inside the 1,200-second interval. This bounds monitor invocation overlap;
it does not terminate a separately running scanner if the monitor times out.
Missed slots are not replayed. Run records retain the scheduled time, absolute
slot, cycle position, selected page, location and transport for coverage audits.

Only the selected page is preflighted; inter-scan sleeps are removed. REST
creation retries only explicit 429 refusals, because an ambiguous 5xx may have
already created a scan. MCP creation remains non-retrying. Existing completion,
freshness, canonical result reads and alert semantics remain in place.
Keyword-based signal diagnostics are not correctness alerts. Typed fixture
assertions and real SDK execution remain separate improvements.

## Deploy

The `Sentinel Monitor AWS Deploy` workflow tests and deploys the handler,
verifies its bytes, then runs `configure_schedule.py --apply`. The schedule
script updates the existing resource and preserves state, dates, encryption,
execution role and dead-letter configuration. It defaults to a read-only plan.
The GitHub deployment role needs the checked-in `github-actions-policy.json`;
the scheduler's existing execution role is passed only to Scheduler.

During first migration, deploy the handler before changing the schedule.
Legacy empty-payload deliveries safely skip in that short transition. Do not
manually invoke extra verification scans; inspect the next scheduled run.

Run tests with `python3 -m unittest infra/aws/sentinel-monitor/test_handler.py`.

## Cost estimate (September 15, 2026)

Scan volume remains 72/day or 2,160/30 days. No scanner/model configuration,
capacity, or retention increase is introduced. Monitor invocations and small
DynamoDB run/lock records rise from 720 to 2,160/month; selected-page preflight
requests fall from 3,600 to 2,160/month. MCP secret reads remain 720/month.
Estimated additional scheduling, request, storage and initialization overhead
is below $0.25/month before savings from removing 16–30 seconds of hourly
inter-scan sleeps. This is below the owner's $1/month pre-approved threshold;
actual net billing depends on execution time and free-tier availability.
