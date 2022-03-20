import { gameMap } from "./gamemap";
import { Team } from "./team"


abstract class BasePiece {
    team: Team;
    name: string;

    constructor(team: Team, name: string) {
        this.team = team;
        this.name = name;
    }

    abstract checkValid(map: gameMap, prev: number, dest: number): boolean;
}

class KingPiece extends BasePiece {
    constructor(team: Team) {
        super(team, "king");
    }
    checkValid(map: gameMap, prev: number, dest: number) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (Math.abs(destPos.x - prevPos.x) <= 1 && Math.abs(destPos.y - prevPos.y) <= 1) {
            return true;
        }
        else {
            return false;
        }
    }
}

class JangPiece extends BasePiece {
    constructor(team: Team) {
        super(team, "jang");
    }
    checkValid(map: gameMap, prev: number, dest: number) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if ((Math.abs(destPos.x - prevPos.x) === 1 && destPos.y === prevPos.y) || (destPos.x === prevPos.x && Math.abs(destPos.y - prevPos.y) === 1)) {
            return true;
        }
        else {
            return false;
        }
    }
}

class SangPiece extends BasePiece {
    constructor(team: Team) {
        super(team, "sang");
    }
    checkValid(map: gameMap, prev: number, dest: number) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (Math.abs(destPos.x - prevPos.x) === 1 && Math.abs(destPos.y - prevPos.y) === 1) {
            return true;
        }
        else {
            return false;
        }
    }
}

class JaPiece extends BasePiece {
    constructor(team: Team) {
        super(team, "ja");
    }
    checkValid(map: gameMap, prev: number, dest: number) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (this.team === "green") {
            if (destPos.x === prevPos.x && destPos.y - prevPos.y === -1) {
                return true;
            } 
            else {
                return false;
            }
        }
        else {
            if (destPos.x === prevPos.x && destPos.y - prevPos.y === 1) {
                return true;
            } 
            else {
                return false;
            }
        }
    }   
}

class HooPiece extends BasePiece {
    constructor(team: Team) {
        super(team, "hoo");
    }
    checkValid(map: gameMap, prev: number, dest: number) {
        const prevPos = map.getCoordinate(prev);
        const destPos = map.getCoordinate(dest);
        if (this.team === "green") {
            if ((Math.abs(destPos.x - prevPos.x) === 1 && destPos.y === prevPos.y) || (destPos.x === prevPos.x && Math.abs(destPos.y - prevPos.y) === 1) || (destPos.y - prevPos.y === -1 && Math.abs(destPos.x - prevPos.x) === 1)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            if ((Math.abs(destPos.x - prevPos.x) === 1 && destPos.y === prevPos.y) || (destPos.x === prevPos.x && Math.abs(destPos.y - prevPos.y) === 1) || (destPos.y - prevPos.y === 1 && Math.abs(destPos.x - prevPos.x) === 1)) {
                return true;
            }
            else {
                return false;
            }
        }
    }
}

export { BasePiece, KingPiece, SangPiece, JangPiece, JaPiece, HooPiece };