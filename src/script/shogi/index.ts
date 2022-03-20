import { TalkChatData, TalkChannel, KnownChatType, ChannelUserInfo } from "node-kakao";
import { readFileSync } from "fs";
import { resolve } from "path";
import { gameData } from "./dist/gamedata";
import { userData } from "./dist/roomdata";
import { teamTable } from "./dist/team";
import { coordinate, home } from "./dist/gamemap";
import { Team } from "./dist/team";
import { pieceTable } from "./dist/piecetable";
import { HooPiece } from "./dist/piece";

const game = new gameData();

export const shogi = async function (data: TalkChatData, channel: TalkChannel) {
    const roomId = channel.channelId.toString();
    const roomData = game.room[roomId];
    const sender = data.getSenderInfo(channel) as ChannelUserInfo;

    if (data.text.startsWith("/시작 십이장기") && roomData === undefined) {
        const input = parseInt(data.text.slice(8));
        if (isNaN(input)) {
            await channel.sendChat("십이장기 게임을 시작합니다.\n/참가 십이장기 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : 없음");
            game.addRoom(roomId, data.chat.sender.userId.toString(), sender.nickname);
            game.room[roomId].useTimeLimit = false;
        }
        else {
            if (input <= 30 || input >= 600) {
                await channel.sendChat("제한 시간은 30초보다 길고 10분보다 짧아야 합니다.");
                return;
            }
            await channel.sendChat(`십이장기 게임을 시작합니다.\n/참가 십이장기 명령어를 통해 게임에 참여해주세요.\n\n> 시간 제한 : ${input}초`);
            game.addRoom(roomId, data.chat.sender.userId.toString(), sender.nickname);
            game.room[roomId].useTimeLimit = false;
            game.room[roomId].timeLimit = input;
        }
        game.room[roomId].roomOwner = new userData(data.chat.sender.userId.toString(), sender.nickname);
        return;
    }

    if (roomData === undefined) return;

    if (data.text === "/참가 십이장기" && !roomData.started) {
        if (Math.random() < 0.5) {
            game.addPlayer(roomId, data.chat.sender.userId.toString(), sender.nickname, "green");
            game.addPlayer(roomId, roomData.roomOwner.id, roomData.roomOwner.nickname, "red");
        }
        else {
            game.addPlayer(roomId, roomData.roomOwner.id, roomData.roomOwner.nickname, "green");
            game.addPlayer(roomId, data.chat.sender.userId.toString(), sender.nickname, "red");
        }
        game.start(roomId);
        await channel.sendChat(`게임을 시작합니다.\n\n레드팀 : ${roomData.players.red?.nickname}님\n그린팀 : ${roomData.players.green?.nickname}님`);
        await game.sleep();
        const mediaList = roomData.map.raw.map(v => (
            { 
                type: KnownChatType.PHOTO,
                name: v === null ? "white.png" : `${v.team}_${v.name}.png`, 
                width: 300, 
                height: 300, 
                data: readFileSync(resolve(__dirname, "./data/picture", (v === null ? "./white.png" : `./${v.team}_${v.name}.png`))), 
                ext: "png"
            }
        ));
        await channel.sendMultiMedia(KnownChatType.MULTIPHOTO, mediaList);
        await game.sleep();
        await channel.sendChat(`선 플레이어는 ${roomData.roomOwner.nickname}(${teamTable[roomData.turnOwner as Team]})님입니다.`);
        if (roomData.timeLimit) {
            await game.setTimelimit(roomId, channel);
        }
        return;
    }
    if (data.text === "/종료 십이장기" && roomData.roomOwner.id ===  roomData.players.red?.id) {
        delete game.room[roomId];
        await channel.sendChat("십이장기 게임이 종료되었습니다.");
        return;
    }

    if (!roomData.started) return;

    if (data.text.startsWith("이동 ") && game.isTurnOwner(roomId, data.chat.sender.userId.toString())) {
        const [prev, dest] = data.text.slice(3).split(" ").map(v => parseInt(v) - 1);
        const turnOwner = roomData.turnOwner as Team;

        if (!coordinate.some(v => v === prev) || !coordinate.some(v => v === dest)) {
            await channel.sendChat("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        const prevData = roomData.map.raw[prev];
        if (prevData === null || prevData.team !== turnOwner) {
            await channel.sendChat("자신의 말을 선택해주세요.");
            return;
        }
        const result = roomData.map.move(roomId, prevData, prev, dest);
        if (!result) {
            await channel.sendChat("이동할 수 없는 지역입니다.");
            return;
        }
        if (roomData.useTimeLimit) {
            const timeout = roomData.timeout;
            if (timeout !== undefined) clearTimeout(timeout);
        }
        if (result.captive !== undefined) {
            if (result.captive.name === "king") {
                await channel.sendChat(`${sender.nickname}(${teamTable[turnOwner]})님이 상대의 왕을 잡으셨습니다.`);
                await game.sleep();
                await channel.sendChat(`${roomData.players[turnOwner]?.nickname}님의 승리로 게임을 종료합니다.`);
                delete game.room[roomId];
                return;
            }
            await channel.sendChat(`${sender.nickname}(${teamTable[turnOwner]})님이 상대의 ${pieceTable[result.captive.name]} 말을 잡았습니다.`);
        }
        if (game.hasOtherPiece(roomId, turnOwner, "ja")) {
            let index;
            if (roomData.turnOwner === "green") {
                index = roomData.map.raw.slice(0, 3).findIndex(e => e !== null && e.name === "ja" && e.team === turnOwner);
            }
            else {
                index = roomData.map.raw.slice(9, 12).findIndex(e => e !== null && e.name === "ja" && e.team === turnOwner) + 9;
            }
            roomData.map.raw[index] = new HooPiece(turnOwner);
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 자가 상대의 진영에 들어가 이제부터 후로 사용됩니다.`);
        }
        if (game.hasOtherPiece(roomId, turnOwner, "king")) {
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 왕이 상대의 진영에 들어갔습니다.\n왕이 다음 차례가 돌아올 때까지 상대의 진영에서 버티게 되면, ${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님이 승리하게 됩니다.`);
        }
        game.changeTurnOwner(roomId);
        if (game.hasOtherPiece(roomId, turnOwner, "king")) {
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 왕이 상대의 진영에서 한 턴 버텼습니다.`);
            await game.sleep();
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 승리로 게임을 종료합니다.`);
            delete game.room[roomId];
            return;
        }
        const mediaList = roomData.map.raw.map(v => (
            { 
                type: KnownChatType.PHOTO,
                name: v === null ? "white.png" : `${v.team}_${v.name}.png`, 
                width: 300, 
                height: 300, 
                data: readFileSync(resolve(__dirname, "./data/picture", (v === null ? "./white.png" : `./${v.team}_${v.name}.png`))), 
                ext: "png"
            }
        ));
        await channel.sendMultiMedia(KnownChatType.MULTIPHOTO, mediaList);
        await game.sleep();
        await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 차례입니다.`);
        if (roomData.useTimeLimit) {
            await game.setTimelimit(roomId, channel);
        }
        return;
    }
    if (data.text.startsWith("내려놓기 ") && game.isTurnOwner(roomId, sender.userId.toString())) {
        const turnOwner = roomData.turnOwner as Team;
        const input = data.text.slice(5).split(" ");
        const selectedPiece = pieceTable[input[0]];
        const selectedPos = parseInt(input[1]) - 1;
        if (!coordinate.some(v => v === selectedPos)) {
            await channel.sendChat("좌표로는 1부터 12까지의 자연수만 입력할 수 있습니다.");
            return;
        }
        if (!Object.keys(pieceTable).some(v => v === selectedPiece) || !roomData.players[turnOwner]?.captive.some(v => v.name === selectedPiece)) {
            await channel.sendChat("내려놓을 수 없는 기물입니다.");
            return;
        }
        if (roomData.map.raw[selectedPos] !== null) {
            await channel.sendChat("내려놓을 수 없는 위치입니다.");
            return;
        }
        if ((roomData.turnOwner === "green" && home.red.some(v => v === selectedPos)) || (roomData.turnOwner === "red" && home.green.some(v => v === selectedPos))) {
            await channel.sendChat("상대의 진영에는 말을 내려놓을 수 없습니다.");
            return;
        }
        if (roomData.useTimeLimit) {
            clearTimeout(roomData.timeout as NodeJS.Timeout);
        }
        roomData.map.setCaptivePos(roomId, turnOwner, selectedPiece, selectedPos);
        game.changeTurnOwner(roomId);
        if (game.hasOtherPiece(roomId, turnOwner, "king")) {
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 왕이 상대의 진영에서 한 턴 버텼습니다.`);
            await game.sleep();
            await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 승리로 게임을 종료합니다.`);            
            delete game.room[roomId];
            return;
        }
        const mediaList = roomData.map.raw.map(v => (
            { 
                type: KnownChatType.PHOTO,
                name: v === null ? "white.png" : `${v.team}_${v.name}.png`, 
                width: 300, 
                height: 300, 
                data: readFileSync(resolve(__dirname, "./data/picture", (v === null ? "./white.png" : `./${v.team}_${v.name}.png`))), 
                ext: "png"
            }
        ));
        await channel.sendMultiMedia(KnownChatType.MULTIPHOTO, mediaList);
        await game.sleep();
        await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 차례입니다.`);
        if (!!roomData.timeLimit) {
            await game.setTimelimit(roomId, channel);
        }
        return;
    }
    if (data.text === "/테이블") {
        const turnOwner = roomData.turnOwner as Team;
        const mediaList = roomData.map.raw.map(v => (
            { 
                type: KnownChatType.PHOTO,
                name: v === null ? "white.png" : `${v.team}_${v.name}.png`, 
                width: 300, 
                height: 300, 
                data: readFileSync(resolve(__dirname, "./data/picture", (v === null ? "./white.png" : `./${v.team}_${v.name}.png`))), 
                ext: "png"
            }
        ));
        await channel.sendMultiMedia(KnownChatType.MULTIPHOTO, mediaList);
        await game.sleep();
        await channel.sendChat(`${roomData.players[turnOwner]?.nickname}(${teamTable[turnOwner]})님의 차례입니다.`);
        return;
    }
    if (data.text === "/포로") {
        await channel.sendChat(`${roomData.players.red?.nickname}(레드)님 : ${roomData.players.red?.captive.map(v => pieceTable[v.name]).sort().join(", ")}\n${roomData.players.green?.nickname}(그린)님 : ${roomData.players.green?.captive.map(v => pieceTable[v.name]).sort().join(", ")}`);
        return;
    }

};