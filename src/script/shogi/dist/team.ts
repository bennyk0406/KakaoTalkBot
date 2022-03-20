export const teamTable = {
    red: "레드",
    green: "그린"
};

export const teamList = ["red", "green"] as const;
export type Team = typeof teamList[number];