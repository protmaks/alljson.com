import { describe, it, expect } from "vitest";
import { flattenForSelect, buildSelect, pathToSqlExpression, pathToDotString } from "@/lib/sqlBuilder";

describe("sqlBuilder", () => {
  describe("flattenForSelect with arrays", () => {
    it("flattens array of objects into individual columns", () => {
      const data = {
        tasks: [
          {
            attempt_number: 0,
            cleanup_duration: 100,
          },
        ],
      };
      const paths = flattenForSelect(data);
      const pathStrings = paths.map((p) => pathToDotString(p));
      expect(pathStrings).toEqual(expect.arrayContaining(["tasks[0].attempt_number", "tasks[0].cleanup_duration"]));
    });

    it("handles deeply nested arrays and objects", () => {
      const data = {
        tasks: [
          {
            cluster_instance: {
              cluster_id: "123",
              spark_context_id: "456",
            },
          },
        ],
      };
      const paths = flattenForSelect(data);
      const pathStrings = paths.map((p) => pathToDotString(p));
      expect(pathStrings).toEqual(
        expect.arrayContaining([
          "tasks[0].cluster_instance.cluster_id",
          "tasks[0].cluster_instance.spark_context_id",
        ]),
      );
    });

    it("treats empty arrays as leaf columns", () => {
      const data = {
        empty_array: [],
      };
      const paths = flattenForSelect(data);
      const pathStrings = paths.map((p) => pathToDotString(p));
      expect(pathStrings).toContain("empty_array");
    });

    it("treats arrays of primitives as leaf columns", () => {
      const data = {
        string_array: ["a", "b", "c"],
      };
      const paths = flattenForSelect(data);
      const pathStrings = paths.map((p) => pathToDotString(p));
      expect(pathStrings).toContain("string_array");
    });
  });

  describe("buildSelect with arrays", () => {
    it("generates correct SQL for flattened arrays", () => {
      const data = {
        tasks: [
          {
            attempt_number: 0,
            cleanup_duration: 100,
          },
        ],
      };
      const paths = flattenForSelect(data);
      const sql = buildSelect(paths, "my_table");
      expect(sql).toContain("tasks[OFFSET(0)].attempt_number AS tasks_attempt_number");
      expect(sql).toContain("tasks[OFFSET(0)].cleanup_duration AS tasks_cleanup_duration");
    });

    it("generates correct aliases without array indices", () => {
      const data = {
        tasks: [
          {
            cluster_instance: {
              cluster_id: "123",
            },
          },
        ],
      };
      const paths = flattenForSelect(data);
      const sql = buildSelect(paths, "my_table");
      expect(sql).toContain("tasks[OFFSET(0)].cluster_instance.cluster_id AS tasks_cluster_instance_cluster_id");
    });

    it("handles mixed arrays and regular objects", () => {
      const data = {
        state: {
          life_cycle_state: "TERMINATED",
        },
        tasks: [
          {
            attempt_number: 0,
          },
        ],
      };
      const paths = flattenForSelect(data);
      const sql = buildSelect(paths, "my_table");
      expect(sql).toContain("state.life_cycle_state AS state_life_cycle_state");
      expect(sql).toContain("tasks[OFFSET(0)].attempt_number AS tasks_attempt_number");
    });
  });

  describe("pathToSqlExpression", () => {
    it("renders array indices as OFFSET", () => {
      const path = [
        { kind: "key" as const, name: "tasks" },
        { kind: "index" as const, index: 0 },
        { kind: "key" as const, name: "id" },
      ];
      const expr = pathToSqlExpression(path);
      expect(expr).toBe("tasks[OFFSET(0)].id");
    });
  });
});
