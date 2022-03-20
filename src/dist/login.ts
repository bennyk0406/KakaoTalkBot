import { account } from "../data/account"; 
import { AuthApiClient, KnownAuthStatusCode, TalkClient } from "node-kakao";
import * as readline from "readline";

export const login = async function (client: TalkClient) {    
    const api = await AuthApiClient.create(account.clientName, account.uuid);
    const form = {
        email: account.email,
        password: account.password
    }
    const loginRes = await api.login(form, true);
    if (loginRes.success) {
        const res = await client.login(loginRes.result);
        if (!res.success) throw new Error(`Login failed with status: ${res.status}`);
        console.log("Login Success!");
    }
    else {
        if (loginRes.status !== KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
            throw new Error(`Web login failed with status: ${loginRes.status}`);
        }
        const passcodeRes = await api.requestPasscode(form);
        if (!passcodeRes.success) throw new Error(`Passcode request failed with status: ${passcodeRes.status}`);
        
        const inputInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const passcode = await new Promise<string>((resolve) => inputInterface.question('Enter passcode: ', resolve));
        inputInterface.close();

        const registerRes = await api.registerDevice(form, passcode, true);
        if (!registerRes.success) throw new Error(`Device registration failed with status: ${registerRes.status}`);

        const loginAfterRes = await api.login(form, true);
        if (!loginAfterRes.success) throw new Error(`Web login failed with status: ${loginAfterRes.status}`);
        console.log("Login Success!");
    }    
};