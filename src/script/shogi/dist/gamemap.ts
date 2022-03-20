import { gameData } from "./gamedata";
import { BasePiece, JangPiece, KingPiece, SangPiece, JaPiece } from "./piece";
import { Team } from "./team";

export class gameMap {
    game: gameData;
    raw: (BasePiece | null)[]
    constructor(game: gameData) {
    	this.game = game;
        this.raw = [
            new JangPiece("red"),   new KingPiece("red"),   new SangPiece("red"), 
            null,                   new JaPiece("red"),     null, 
            null,                   new JaPiece("green"),   null, 
            new SangPiece("green"), new KingPiece("green"), new JangPiece("green")
        ];
    }
    getCoordinate(index: number) {
        return {x: index % 3, y: Math.floor(index / 3)};
    }
    move(roomId: string, piece: BasePiece, prev: number, dest: number) {
        if (!piece.checkValid(this, prev, dest)) return false;
        let captive;
        const destData = this.raw[dest];
        if (destData !== null) {
            if (destData.team === this.game.room[roomId].turnOwner) {
            	return false;
            }
            captive = destData;
            if (captive.name === "hoo") {
                captive = new JaPiece(piece.team);
            }
            else {
                captive.team = piece.team;
            }
            this.game.addCaptive(roomId, piece.team, captive);
        }
        this.raw[dest] = piece;
        this.raw[prev] = null;
        return { captive };
    }
    setCaptivePos(roomId: string, team: Team, name: string, pos: number) {
        const playerData = this.game.room[roomId].players[team];
        if (playerData === undefined) return;
    	switch (name) {
    	    case "ja": 
                this.raw[pos] = new JaPiece(team);
                break;
            case "sang":
                this.raw[pos] = new SangPiece(team);
                break;
            case "jang":
                this.raw[pos] = new JangPiece(team);
                break;
    	}
        playerData.captive.splice(playerData.captive.findIndex(e => e.name === name), 1);
        return true;
    }
}

export const coordinate = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const home = {
    red: [0, 1, 2],
    green: [9, 10, 11]
};