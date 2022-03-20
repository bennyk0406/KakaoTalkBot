import { TalkChannel } from "node-kakao";
import { BasePiece } from "./piece";
import { playerData, roomData } from "./roomdata";
import { Team } from "./team";

export class gameData {
    room: {[key: string]: roomData};

    constructor() {
        this.room = {};
    }

    addRoom(roomId: string, roomOwnerId: string, roomOwnerNickname: string) {
        this.room[roomId] = new roomData(this, roomOwnerId, roomOwnerNickname);
    }
    addPlayer(roomId: string, playerId: string, nickname: string, team: Team) {
        this.room[roomId].players[team] = new playerData(playerId, nickname, []);
    }
    addCaptive(roomId: string, team: Team, captive: BasePiece) {
        const playerData = this.room[roomId].players[team];
        if (playerData === undefined) return false;
        playerData.captive.push(captive);
    }
    start(roomId: string) {
        const teamList = ["green", "red"];
        this.room[roomId].turnOwner = teamList[Math.floor(Math.random() * 2)];
        this.room[roomId].started = true;
    }
    changeTurnOwner(roomId: string) {
        switch (this.room[roomId].turnOwner) {
            case "green": 
                this.room[roomId].turnOwner = "red";
                break;
            case "red":
                this.room[roomId].turnOwner = "green";
                break;
        }
    }
    hasOtherPiece(roomId: string, team: Team, pieceName: string) {
        if (team === "green") {
            return this.room[roomId].map.raw.slice(0, 3).some((e: BasePiece | null) => e?.name === pieceName && e?.team === "green");
        }
        else {
            return this.room[roomId].map.raw.slice(9, 12).some((e: BasePiece | null) => e?.name === pieceName && e?.team === "red");
        }
    }
    isTurnOwner(roomId: string, playerId: string) {
        const turnOwner = this.room[roomId].turnOwner;
        if (turnOwner === undefined) return false;
        return playerId === this.room[roomId].players[turnOwner]?.id;
    }
    sleep() {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    async alertLeftTime(roomId: string, channel: TalkChannel, time: number) {
        const timeout = this.room[roomId].timeout;
        if (timeout === undefined) return false;
        clearTimeout(timeout);
        await channel.sendChat(`${time}초 남았습니다.`);
    }
    async setTimelimit(roomId: string, channel: TalkChannel) {
        const turnOwner = this.room[roomId].turnOwner;
        const roomOwner = this.room[roomId].roomOwner;
        const timeout = this.room[roomId].timeout;
        const timeLimit = this.room[roomId].timeLimit;
        if (turnOwner === undefined || roomOwner === undefined || timeout === undefined || typeof timeLimit === "boolean") return false;
        this.room[roomId].timeout = setTimeout(async () => {
            await this.alertLeftTime(roomId, channel, 30);
            this.room[roomId].timeout = setTimeout(async () => {
                await this.alertLeftTime(roomId, channel, 10);
                this.room[roomId].timeout = setTimeout(async () => {
                    await this.alertLeftTime(roomId, channel, 5);
                    this.room[roomId].timeout = setTimeout(async () => {
                        await channel.sendChat(`${this.room[roomId].players[turnOwner]?.nickname}(${turnOwner})님이 제한 시간 안에 수를 두지 못하여 패배하셨습니다.`);
                        clearTimeout(timeout);
                        await this.sleep();
                        this.changeTurnOwner(roomId);
                        await channel.sendChat(`${this.room[roomId].players[turnOwner]?.nickname}(${turnOwner})님의 승리로 게임을 종료합니다.`);
                        delete this.room[roomId];
                        return true;
                    }, 8 * 1000)
                }, (10 - 5) * 1000);
            }, (30 - 10) * 1000);
        }, (timeLimit - 30) * 1000);
    }
}