import { gameData } from "./gamedata";
import { gameMap } from "./gamemap";
import { BasePiece } from "./piece";

export class userData {
    id: string;
    nickname: string;

    constructor(id: string, nickname: string) {
        this.id = id;
        this.nickname = nickname;
    }
}
export class playerData extends userData {
    captive: BasePiece[];

    constructor(id: string, nickname: string, captive: BasePiece[]) {
        super(id, nickname);
        this.captive = captive;
    }
}

export class roomData {
    players: {[key: string]: playerData | undefined};
    turnOwner: string | undefined;
    started: boolean;
    map: gameMap;
    timeout: NodeJS.Timeout | undefined;
    useTimeLimit: boolean;
    timeLimit: number;
    roomOwner: {id: string, nickname: string};
    
    constructor(game: gameData, roomOwnerId: string, roomOwnerNickname: string) {
        this.players = {
            red: undefined,
            green: undefined
        };
        this.turnOwner = undefined;
        this.started = false;
        this.map = new gameMap(game);
        this.timeout = undefined;
        this.useTimeLimit = false;
        this.timeLimit = 0;
        this.roomOwner = new userData(roomOwnerId, roomOwnerNickname);
    }
}