import { describe, it, expect } from "vitest";
import { flattenForSelect, buildSelect, pathToDotString } from "../lib/sqlBuilder";

describe("Azure JSON schema merging", () => {
  it("should merge schemas from all array elements", () => {
    const testData = [
      {
        autoscale: {
          max_workers: 4,
          min_workers: 1,
        },
        termination_reason: {
          code: "JOB_FINISHED",
          type: "SUCCESS",
        },
      },
      {
        termination_reason: {
          code: "AZURE_QUOTA_EXCEEDED_EXCEPTION",
          parameters: {
            databricks_error_message: "The VM size...",
            instance_id: "failed-b0b21740-74f6-4ade-8",
            azure_error_code: "QuotaExceeded",
            azure_error_message: "Operation could not be completed...",
          },
          type: "CLIENT_ERROR",
        },
      },
    ];

    const paths = flattenForSelect(testData);
    const pathStrings = paths.map((p) => pathToDotString(p));

    // Verify that we have fields from the first element
    expect(pathStrings).toContain("[0].autoscale.max_workers");
    expect(pathStrings).toContain("[0].autoscale.min_workers");
    expect(pathStrings).toContain("[0].termination_reason.code");
    expect(pathStrings).toContain("[0].termination_reason.type");

    // Verify that we have fields that only appear in the second element
    expect(pathStrings).toContain("[0].termination_reason.parameters.databricks_error_message");
    expect(pathStrings).toContain("[0].termination_reason.parameters.instance_id");
    expect(pathStrings).toContain("[0].termination_reason.parameters.azure_error_code");
    expect(pathStrings).toContain("[0].termination_reason.parameters.azure_error_message");

    // Verify no duplicates
    expect(pathStrings.length).toBe(new Set(pathStrings).size);

    // Verify SQL generation
    const sql = buildSelect(paths, "my_table");
    expect(sql).toContain("[OFFSET(0)].termination_reason.code");
    expect(sql).toContain("[OFFSET(0)].termination_reason.parameters.databricks_error_message");
  });
});
