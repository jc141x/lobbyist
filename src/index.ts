import {
  MatrixClient,
  MemoryStorageProvider,
  RichReply,
} from "matrix-bot-sdk";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const homeserverUrl = process.env.HOMESERVER || "";

const accessToken = process.env.ACCESS_TOKEN || "";
if (!accessToken || !homeserverUrl) {
  console.error("ACCESS_TOKEN and HOMESERVER is required");
  process.exit(1);
}
const storage = new MemoryStorageProvider();

const client = new MatrixClient(homeserverUrl, accessToken, storage);

const fakeSites = [
  "1377x.to",
  "1337xto.to",
  "1337xto.to",
  "1337xx.to",
  "1337xxx.to",
  "1337x.tw",
  "rargb.to",
];
const realSites = [
  "1337x.to",
  "1337x.st",
  "x1337x.ws",
  "x1337x.eu",
  "x1337x.se",
];

const replyRegex = /<mx-reply>[\s\S]*?<\/mx-reply>/g;
const rssReplyText =
  "You can use our RSS feed as an ad-free altenative to 1337x https://github.com/jc141x/releases-feed";
const rssReplyHtml =
  "You can use our RSS feed as an ad-free altenative to 1337x https://github.com/jc141x/releases-feed";
const fakeSiteReplyText =
  "You are using an unmoderated fake copy of 1337x, please use one of the official domains:\n\n* 1337x.to\n* 1337x.st\n* x1337x.ws\n* x1337x.eu\n* x1337x.se\n\n" +
  rssReplyText;
const fakeSiteReplyHtml =
  "You are using an unmoderated fake copy of 1337x, please use one of the official domains:\n\n<ul>\n<li>1337x.to</li>\n<li>1337x.st</li>\n<li>x1337x.ws</li>\n<li>x1337x.eu</li>\n<li>x1337x.se</li>\n</ul>\n\n" +
  rssReplyHtml;

client.on("room.event", handleEvent);
client.on("room.message", handleMessage);

client.start().then(() => console.log("Client started!"));

async function handleEvent(roomId: string, event: any) {
  if (event["type"] !== "m.room.member") return;
  if (event["content"]["membership"] !== "join") return;
  if (event?.["unsigned"]?.["prev_content"]?.["membership"] === "join") return;

  const userId = event["state_key"];
  const displayName = event["content"]["displayname"] || userId;

  client.sendHtmlText(
    roomId,
    `Welcome <a href='https://matrix.to/#/${userId}'>${displayName}</a>! Please send the link to from where you download our torrents.`
  );
}

async function handleMessage(roomId: string, event: any) {
  if (!event["content"]) return;
  if (event["content"]["msgtype"] !== "m.text") return;
  if (event["sender"] === (await client.getUserId())) return;

  const messageBody =
    event["content"]["formatted_body"]?.replace(replyRegex, "") ||
    event["content"]["body"];

  if (fakeSites.some((str) => messageBody.includes(str))) {
    const richReply = RichReply.createFor(
      roomId,
      event,
      fakeSiteReplyText,
      fakeSiteReplyHtml
    );
    client.sendMessage(roomId, richReply);
    return;
  }
  if (realSites.some((str) => messageBody.includes(str))) {
    const richReply = RichReply.createFor(
      roomId,
      event,
      rssReplyText,
      rssReplyHtml
    );
    client.sendMessage(roomId, richReply);
    return;
  }
}
