export async function runCommentMonitoring(credentials) {
	try {
		console.log("🚀 Starting comment monitoring...");

		if (!credentials || !credentials.email || !credentials.password) {
			throw new Error("❌ No credentials provided for comment monitoring.");
		}

		// Get all successful job posts that need comment monitoring
		const jobPosts = await prisma.jobPost.findMany({
			where: {
				status: "SUCCESS",
				postUrl: { not: null },
			},
			include: {
				job: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 10, // Process only recent 10 posts to avoid overload
		});

		if (jobPosts.length === 0) {
			console.log("📭 No successful posts found to monitor");
			return { success: true, message: "No posts to monitor", processed: 0 };
		}

		console.log(`📋 Found ${jobPosts.length} posts to monitor for comments`);

		// Initialize browser and context
		const browser = await initializeCommentBrowser();
		const context = await getCommentContextForUser(browser, credentials.email);
		const page = await context.newPage();

		// Set up page event listeners
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.log(`🔍 Browser console error: ${msg.text()}`);
			}
		});

		// Ensure login
		console.log("🔑 Ensuring user is logged in...");
		await ensureLoggedIn({ page, context, credentials });

		const results = [];

		// Group posts by Facebook group for efficient processing
		const postsByGroup = {};
		jobPosts.forEach((post) => {
			const groupUrl = post.facebookGroupUrl;
			if (!postsByGroup[groupUrl]) {
				postsByGroup[groupUrl] = [];
			}
			postsByGroup[groupUrl].push(post);
		});

		// Process each group
		for (const [groupUrl, groupPosts] of Object.entries(postsByGroup)) {
			try {
				console.log(`🏢 Processing group: ${groupUrl}`);

				// Get recent posted content URLs for this group
				const postUrls = await getMyPostedContent(page, groupUrl);

				if (postUrls.length === 0) {
					console.log(`📭 No recent posts found in group: ${groupUrl}`);
					continue;
				}

				// Process comments for each post URL - match with job posts by group
				for (let i = 0; i < Math.min(postUrls.length, groupPosts.length); i++) {
					const postUrl = postUrls[i];
					const jobPost = groupPosts[i]; // Get the corresponding job post

					// Pass the full jobPost object, not just the title
					const result = await processPostComments(
						page,
						postUrl,
						jobPost // Pass the full jobPost object
					);
					results.push(result);
				}
			} catch (err) {
				console.error(`❌ Error processing group ${groupUrl}:`, err.message);
			}
		}

		await page.close();
		await context.close();
		await browser.close();

		return { success: true, message: "Comment monitoring completed", processed: results.length, results };
	} catch (error) {
		console.error("❌ Comment monitoring error:", error.message);
		return { success: false, message: error.message };
	}
}

import { chromium } from "playwright";
import { ensureLoggedIn } from "./facebook-login.js";
import { humanPause } from "./utils/delays.js";
import { prisma } from "../lib/prisma.js";

// Store browser context globally
let commentBrowser = null;
let commentContext = null;
let currentUser = null;

// Hardcoded messenger link (replace with your Facebook Page ID)
const MESSENGER_LINK = "https://m.me/61579236676817"; // Replace with actual page ID

// Keywords to look for in comments
const INTEREST_KEYWORDS = [
	"interested",
	"hire me",
	"i am interested",
	"i'm interested",
	"looking for job",
	"need job",
	"available",
	"apply",
	"contact me",
	"dm me",
	"message me",
];

// Updated comment selectors with the exact structure you provided
const CommentSelectors = {
	// Comment container selector
	commentContainer: "div.xwib8y2.xpdmqnj.x1g0dm76.x1y1aw1k",

	// Comment text selectors with fallbacks
	commentText: [
		"span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u",
		'div[dir="auto"]',
		'span[dir="auto"]',
		".x193iq5w",
		'div[style*="text-align"]',
	],

	// Comment author selector
	commentAuthor:
		"span.x3nfvp2 span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x676frb.x1nxh6w3.x1sibtaa.x1s688f.xzsf02u",

	// Updated reply button selectors based on your inspection
	replyButton: [
		// Exact structure from your inspection
		'li.html-li div.html-div div.x1i10hfl.xjbqb8w.x1ejq31n.x18oe1m7.x1sy0etr.xstzfhl.x972fbf.x10w94by.x1qhh985.x14e42zd.x9f619.x1ypdohk.xt0psk2.x3ct3a4.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xkrqix3.x1sur9pj.xi81zsa.x1s688f[role="button"]:has-text("Reply")',

		// More specific variations
		'li.html-li.xdj266r.xat24cr.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1rg5ohu.x1xegmmw.x13fj5qh div[role="button"]:has-text("Reply")',

		// Target the button element directly with Reply text
		'div.x1i10hfl.xjbqb8w.x1ejq31n.x18oe1m7.x1sy0etr.xstzfhl.x972fbf.x10w94by.x1qhh985.x14e42zd.x9f619.x1ypdohk.xt0psk2.x3ct3a4.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xkrqix3.x1sur9pj.xi81zsa.x1s688f[role="button"]:has-text("Reply")',

		// Fallback selectors
		'li.html-li div[role="button"]:has-text("Reply")',
		'div[role="button"]:has-text("Reply")',
		'[role="button"]:has-text("Reply")',

		// Generic fallbacks
		'li.html-li div.html-div div[role="button"]',
		'li.html-li div[role="button"]',
		'li div.html-div div[role="button"]',
		'li div[role="button"]',
		'div[role="button"][tabindex="0"]',
		'div[role="button"]',
	],

	replyTextArea:
		'[contenteditable="true"][data-testid="comment-textbox"], div[contenteditable="true"][role="textbox"]',

	// Submit button selectors with fallbacks
	replySubmitButton: [
		'div.x1i10hfl.x1qjc9v5.xjqpnuy.xc5r6h4.xqeqjp1.x1phubyo.x9f619.x1ypdohk.xdl72j9.x2lah0s.x3ct3a4.x2lwn1j.xeuugli.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1fmog5m.xu25z0z.x140muxe.xo1y3bh.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz.xjyslct.xjbqb8w.x13fuv20.x18b5jzi.x1q0q8m5.x1t7ytsu.x972fbf.x10w94by.x1qhh985.x14e42zd.x3nfvp2.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1n2onr6.x3ajldb.xrw4ojt.xg6frx5.xw872ko.xhgbb2x.x1xhcax0.x1s928wv.x1o8326s.x56lyyc.x1j6awrg.x1tfg27r.xitxdhh[role="button"][aria-label="Comment"]',
		'div[role="button"][aria-label="Comment"]',
		'[aria-label="Comment"]',
	],
	// ...existing code...
};


export async function cleanupCommentMonitoring() {
	try {
		if (commentContext) {
			await commentContext.close();
			commentContext = null;
			currentUser = null;
		}

		if (commentBrowser) {
			await commentBrowser.close();
			commentBrowser = null;
		}

		console.log("🧹 Comment monitoring cleanup completed");
	} catch (error) {
		console.error("❌ Comment monitoring cleanup error:", error.message);
	}
}
