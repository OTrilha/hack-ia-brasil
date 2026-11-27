export const mentors = [
  "Felipe Duarte",
  "Tiago Trindade",
  "Gabriel Ayres",
  "Gabriel Carvalho",
  "Beatriz Pessoa",
  "Emyle Lucena",
  "Eric Barreto",
  "Daniel Brandão",
  "Luigi Schmitt",
  "Puca",
];

type Slot = {
  time: string;
  groups: number;
  assignments?: { group: string; mentors: string[] }[];
};

export const rounds: { period: string; slots: Slot[] }[] = [
  {
    period: "Manhã",
    slots: [
      { time: "10:30", groups: 5 },
      { time: "10:40", groups: 5 },
      { time: "10:50", groups: 5 },
      { time: "11:00", groups: 5 },
      { time: "11:10", groups: 3 },
    ],
  },
  {
    period: "Tarde",
    slots: [
      { time: "14:00", groups: 3 },
      { time: "14:10", groups: 5 },
      { time: "14:20", groups: 5 },
      { time: "14:30", groups: 5 },
      { time: "14:40", groups: 5 },
    ],
  },
];
