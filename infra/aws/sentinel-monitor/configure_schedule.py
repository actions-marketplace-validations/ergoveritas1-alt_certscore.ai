"""Update the existing sentinel schedule after the verified handler deployment."""
import argparse
import json
import subprocess

REGION = "us-west-2"
NAME = "certscore-sentinel-hourly"  # Preserve the existing resource and its IAM ARN.
FUNCTION_ARN = "arn:aws:lambda:us-west-2:199536052647:function:certscore-sentinel-monitor"
ROLE_ARN = "arn:aws:iam::199536052647:role/certscore-sentinel-scheduler-role"


def schedule_update(current):
    if current["Name"] != NAME or current["GroupName"] != "default":
        raise ValueError("unexpected sentinel schedule")
    if current["Target"]["Arn"] != FUNCTION_ARN or current["Target"]["RoleArn"] != ROLE_ARN:
        raise ValueError("unexpected sentinel target or execution role")
    # UpdateSchedule replaces unspecified optional properties. Preserve all
    # supported existing properties, including DLQ, dates, state and encryption.
    fields = ("Name", "GroupName", "Description", "StartDate", "EndDate", "State",
              "KmsKeyArn", "ActionAfterCompletion")
    result = {key: current[key] for key in fields if key in current}
    result.update({
        "ScheduleExpression": "cron(0/20 * * * ? *)",
        "ScheduleExpressionTimezone": "UTC",
        "FlexibleTimeWindow": {"Mode": "OFF"},
        "Target": {**current["Target"],
                   "Input": json.dumps({"scheduledTime": "<aws.scheduler.scheduled-time>"}),
                   "RetryPolicy": {"MaximumEventAgeInSeconds": 180, "MaximumRetryAttempts": 0}},
    })
    return result


def aws(*arguments):
    return json.loads(subprocess.check_output(
        ["aws", "scheduler", *arguments, "--region", REGION, "--output", "json"], text=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    desired = schedule_update(aws("get-schedule", "--name", NAME))
    if not args.apply:
        print(json.dumps(desired, indent=2))
        return
    aws("update-schedule", "--cli-input-json", json.dumps(desired))
    # Verify the real response, not the normalized desired schedule alone.
    deployed = aws("get-schedule", "--name", NAME)
    for key, value in desired.items():
        if deployed.get(key) != value:
            raise RuntimeError("sentinel schedule verification failed: " + key)
    print(json.dumps({"name": NAME, "schedule": deployed["ScheduleExpression"],
                      "state": deployed["State"], "verified": True}))


if __name__ == "__main__":
    main()
