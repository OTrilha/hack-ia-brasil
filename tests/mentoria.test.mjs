import assert from "node:assert/strict";
import { test } from "node:test";
import { mentorPairs, rounds } from "../src/guide/mentoria.ts";

test("cada grupo recebe uma dupla diferente em cada período", () => {
  const groups = Array.from({ length: 23 }, (_, index) => index + 1);
  const seen = new Map(groups.map((group) => [group, new Set()]));

  assert.equal(rounds.length, 2);
  for (const { slots } of rounds) {
    const visits = slots.flatMap(({ groups }) => Object.entries(groups));
    assert.deepEqual(visits.map(([, group]) => group).sort((a, b) => a - b), groups);
    for (const [pair, group] of visits) {
      assert.ok(Object.hasOwn(mentorPairs, pair));
      const pairs = seen.get(group);
      assert.ok(!pairs.has(pair), `Grupo ${group} repete a dupla ${mentorPairs[pair]}`);
      pairs.add(pair);
    }
  }
});

test("cinco mesas simultâneas por horário e três no fim de cada período", () => {
  for (const { slots } of rounds) {
    assert.deepEqual(slots.map(({ groups }) => Object.keys(groups).length), [5, 5, 5, 5, 3]);
  }
});

test("a carga das duplas difere em no máximo uma visita", () => {
  const visits = rounds.flatMap(({ slots }) => slots.flatMap(({ groups }) => Object.keys(groups)));
  const loads = Object.keys(mentorPairs).map((pair) => visits.filter((visit) => visit === pair).length);
  assert.ok(Math.max(...loads) - Math.min(...loads) <= 1);
});
