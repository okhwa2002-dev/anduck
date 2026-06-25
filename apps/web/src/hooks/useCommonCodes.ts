import { useCallback, useMemo } from "react";
import { useCommonCodeStore } from "@/providers/CommonCodeProvider";
import type { Code, CodeGroup } from "@anduck/types";

const EMPTY_CODES: Code[] = [];

export function useCommonCodeGroups(groupCodes: string[]) {
  const groups = useCommonCodeStore();
  const groupCodeKey = groupCodes.join(",");

  const data = useMemo(() => {
    if (!groups) return undefined;
    if (!groupCodeKey) return groups;
    const wanted = new Set(groupCodeKey.split(","));
    return groups.filter((group) => wanted.has(group.groupCode));
  }, [groups, groupCodeKey]);

  return { data, isLoading: groups === undefined };
}

export function useCommonCode(groupCode: string) {
  const { data: groups, isLoading } = useCommonCodeGroups([groupCode]);
  const group = groups?.[0];
  const codes = group?.codes ?? EMPTY_CODES;

  const options = useMemo(() => codesToOptions(codes), [codes]);
  const labelMap = useMemo(() => codesToLabelMap(codes), [codes]);
  const extraStringMap = useCallback(
    (key: string) => codesToExtraStringMap(codes, key),
    [codes],
  );

  return {
    group,
    codes,
    options,
    labelMap,
    extraStringMap,
    isLoading,
  };
}

export function findCodeGroup(groups: CodeGroup[] | undefined, groupCode: string) {
  return groups?.find((group) => group.groupCode === groupCode);
}

export function codesToOptions(codes?: Code[]) {
  return (codes ?? []).map((code) => ({ value: code.code, label: code.name, extra: code.extra }));
}

export function codesToLabelMap(codes?: Code[]) {
  return Object.fromEntries((codes ?? []).map((code) => [code.code, code.name])) as Record<string, string>;
}

export function codesToExtraStringMap(codes: Code[] | undefined, key: string) {
  return Object.fromEntries(
    (codes ?? [])
      .map((code) => [code.code, code.extra?.[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}
