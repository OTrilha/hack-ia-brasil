export const mentorPairs = {
  felipe: "Felipe Duarte e Puca",
  tiago: "Tiago Trindade e Beatriz Pessoa",
  eric: "Eric Barreto e Emyle Lucena",
  gabriel: "Gabriel Ayres e Gabriel Carvalho",
  luigi: "Luigi Schmitt e Daniel Brandão",
} as const;

export type MentorPair = keyof typeof mentorPairs;

type MentorSlot = {
  time: string;
  groups: Partial<Record<MentorPair, number>>;
};

export const rounds: { period: string; slots: MentorSlot[] }[] = [
  {
    period: "Manhã",
    slots: [
      { time: "10:30", groups: { felipe: 1, tiago: 2, eric: 3, gabriel: 4, luigi: 5 } },
      { time: "10:40", groups: { felipe: 6, tiago: 7, eric: 8, gabriel: 9, luigi: 10 } },
      { time: "10:50", groups: { felipe: 11, tiago: 12, eric: 13, gabriel: 14, luigi: 15 } },
      { time: "11:00", groups: { felipe: 16, tiago: 17, eric: 18, gabriel: 19, luigi: 20 } },
      { time: "11:10", groups: { felipe: 21, tiago: 22, eric: 23 } },
    ],
  },
  {
    period: "Tarde",
    slots: [
      { time: "14:00", groups: { felipe: 19, tiago: 21, eric: 22, gabriel: 20, luigi: 23 } },
      { time: "14:10", groups: { felipe: 14, tiago: 15, eric: 17, gabriel: 18, luigi: 16 } },
      { time: "14:20", groups: { felipe: 12, tiago: 10, eric: 11, gabriel: 13, luigi: 9 } },
      { time: "14:30", groups: { felipe: 5, tiago: 4, eric: 7, gabriel: 6, luigi: 8 } },
      { time: "14:40", groups: { eric: 1, gabriel: 2, luigi: 3 } },
    ],
  },
];
