const { google } = require("googleapis");

const CLIENT_ID =
	"1067517631003-bto90dc225e5ab42347hjkrfkn0ce8rf.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:8000/callback";

const oAuth2Client = new google.auth.OAuth2(
	CLIENT_ID = process.env.CLIENT_ID,
	CLIENT_SECRET = process.env.CLIENT_SECRET,
	REDIRECT_URI = process.env.REDIRECT_URI
);

const generateAuthUrl = () => {
	return oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: [
			"https://mail.google.com/",
			"https://www.googleapis.com/auth/gmail.labels",
		],
	});
};

exports.loginUser = (req, res) => {
	const authUrl = generateAuthUrl();
	res.redirect(authUrl);
};

exports.loginUserCallback = async (req, res) => {
	try {
		const { code } = req.query;

		if (!code) {
			throw new Error("Authorization code missing");
		}

		const authResponse = await oAuth2Client.getToken(code);
		const { tokens } = authResponse;
		oAuth2Client.setCredentials(tokens);
		// console.log(tokens)
		const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

		const checkIfThreadReplied = async (threadId) => {
			try {
				const res = await gmail.users.threads.get({
					userId: "me",
					id: threadId,
				});

				const thread = res.data;
				const messages = thread.messages;
				// console.log(messages)

				if (messages && messages.length) {
					const lastMessage = messages[messages.length - 1];
					return lastMessage.labelIds.includes("SENT");
				}
				return false;
			} catch (error) {
				console.error("Error checking thread reply status:", error);
				return false;
			}
		};

		const fetchUnrepliedThreads = async () => {
			try {
				const res = await gmail.users.threads.list({ userId: "me" });
				const threads = res.data.threads;

				if (threads && threads.length) {
					for (const thread of threads) {
						const threadId = thread.id;
						const replied = await checkIfThreadReplied(threadId);

						if (!replied) {
							await sendReply(threadId);
						}
					}
				} else {
					console.log("No threads found.");
				}
			} catch (error) {
				console.error("Error retrieving threads:", error);
			}
		};

		const sendReply = async (threadId) => {
			try {
				const threadResponse = await gmail.users.threads.get({
					userId: "me",
					id: threadId,
				});
				const thread = threadResponse.data;
				const lastMessage = thread.messages[thread.messages.length - 1];

				const replyEmail = {
					to: lastMessage.payload.headers.find(
						(header) => header.name === "From"
					).value,
					subject:
						"Auto Reply: " +
						lastMessage.payload.headers.find(
							(header) => header.name === "Subject"
						).value,
					body: "This is an automatic reply to your email.",
				};

				const mail = "shettyvimal0777@gmail.com";

				const messageParts = [
					`From: <${mail}>`,
					`To: ${replyEmail.to}`,
					`Subject: ${replyEmail.subject}`,
					"",
					`${replyEmail.body}`,
				];

				const rawMessage = messageParts.join("\n").trim();

				const encodedMessage = Buffer.from(rawMessage)
					.toString("base64")
					.replace(/\+/g, "-")
					.replace(/\//g, "_")
					.replace(/=+$/, "");

				const message = {
					userId: "me",
					requestBody: {
						threadId: threadId,
						raw: encodedMessage,
					},
				};

				await gmail.users.messages.send(message);

				console.log("Reply sent successfully");
			} catch (error) {
				console.error("Error sending reply:", error);
			}
		};

		fetchUnrepliedThreads();

		setInterval(() => {
			loginUser(req, res);
			loginUserCallback(req, res);
		}, getRandomInterval(45, 120) * 1000);
	} catch (error) {
		console.error("Error authenticating:", error);
		res.status(500).send("Authentication error");
	}
};

function getRandomInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
