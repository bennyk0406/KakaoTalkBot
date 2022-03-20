import { TalkChatData, TalkChannel, ChatBuilder, ReplyContent, MentionContent, KnownChatType, ReplyAttachment, ChannelUserInfo, Long } from "node-kakao";

export const main = async function (data: TalkChatData, channel: TalkChannel) {
    const sender = data.getSenderInfo(channel) as ChannelUserInfo;

    if (data.text === "/Ping") {
        await channel.sendChat(
            new ChatBuilder()
                .append(new ReplyContent(data.chat))
                .text("Pong, ")
                .append(new MentionContent(sender))
                .text("!")
                .build(KnownChatType.REPLY)
        );
        return;
    }

    if (data.originalType === KnownChatType.REPLY && data.text === "/readers") {
        const reply = data.attachment() as ReplyAttachment;
        const logId = reply.src_logId as Long;
        const readers = channel.getReaders({ 
            logId
        });
        await channel.sendChat(`Readers : ${readers.length}명\n\n${readers.map(reader => reader.nickname).join(', ')}`);
        return;
    }

    if (data.originalType === KnownChatType.REPLY && data.text.startsWith("/밑메")) {
        const reply = data.attachment() as ReplyAttachment;
        let index: number;
        if (data.text === "/밑메") {
            index = 0;
        }
        else {
            index = parseInt(data.text.slice(4)) - 1;
            if (isNaN(index)) {
                await channel.sendChat("유효하지 않은 입력입니다.");
                return;
            }
        }
        const res = await channel.getChatListFrom(reply.src_logId);
        if (!res.success) {
            await channel.sendChat("채팅 리스트를 불러올 수 없습니다.");
            return;
        }
        const chatList = res.result;
        if (index >= chatList.length) {
            await channel.sendChat("불러올 수 없는 메세지입니다.");
            return;
        }
        const chatInfo = chatList[index];
        await channel.sendChat(`해당 메세지의 정보입니다.\n\nType : ${chatInfo.type}\nText : ${chatInfo.text}${chatInfo.attachment === undefined ? "" : `\nAttachment : ${JSON.stringify(chatInfo.attachment, null, 4)}`}`);
        return;
    }

    if (data.text === "/id") {
        await channel.sendChat(`${sender.userId}`);
        return;
    }

    if (data.text.startsWith("eval ") && sender.userId.toString() === "350062625") {
        const input = data.text.slice(5);
        try {
            const res = eval(input);
            if (typeof res === "object") {
                await channel.sendChat(`Result : ${JSON.stringify(res, null, 4)}`);
                return;
            }
            await channel.sendChat(`Result : ${res}`);
            return;
        } catch (e: any) {
            await channel.sendChat(`Error Catched!${"\u200b".repeat(500)}\n\n${e.stack}`);
            return;
        }
    }
};