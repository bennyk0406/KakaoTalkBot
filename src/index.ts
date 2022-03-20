import { TalkClient } from "node-kakao";
import { login } from "./dist/login";
import { main, shogi } from "./script";

const client = new TalkClient();

login(client).then();

client.on("chat", async (data, channel) => {
    await main(data, channel);
    await shogi(data, channel);
});