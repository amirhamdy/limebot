import { Injectable } from "@nestjs/common";
import * as TelegramBot from "node-telegram-bot-api";

@Injectable()
export class TelegramService {
  private readonly bot: TelegramBot;
  private readonly userLanguages: Record<number, string> = {}; // In-memory storage for user languages
  private readonly helloStickerId = "CAACAgIAAxkBAAEn_VhlaQ2goBWGKL7BF_Kq_PZs4aCI6AACIwEAAjDUnRGe2TeBrqpcAjME";
  private readonly byeStickerId = "CAACAgIAAxkBAAEn_WRlaQ58CM2JNInNvO2zvpIzciuFnwACGgEAAjDUnRH57gaIxvI3IzME";
  // private readonly getAccessCodeStickerId = "CAACAgIAAxkBAAEn_WplaQ-L9BuGOJiS7ANo6dYBbufM2AACHAEAAjDUnRFu6owpqq4XTjME";
  private readonly getAccessCodeStickerId = "CAACAgIAAxkBAAEn_XJlaREa9XqnciKaDcnWdydxHnMmXQACFQEAAjDUnRFu7npJszVOQjME";
  private readonly sadStickerId = "CAACAgIAAxkBAAEn_YxlaRWGz0WoS_Rlr--ckxc5fnJMkQACgQEAAiteUwteCmw-bAABeLQzBA";
  private readonly bananaStickerId = "CAACAgIAAxkBAAEn_YhlaRVLadDKBkmTHh8ov2VLxtKzeQACiQADFkJrCkbL2losgrCOMwQ";

  constructor() {
    const token = "6481031251:AAFYpT0KGH96-OJqrQIQmRH9sv_8AiollvQ";
    this.bot = new TelegramBot(token, { polling: true });
    this.init();
  }

  private init() {
    this.bot.setMyCommands([
      { command: "start", description: "let's get started" },
      { command: "checkin", description: "how can I check in?" },
      { command: "checkout", description: "how can I check out?" },
      { command: "help", description: "get help information" }
    ]).then(r => {
      console.log({ r });
    });

    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help|More help/, (msg) => this.handleHelp(msg)); // Updated command handler
    this.bot.onText(/\/check\s*in|How can I check in/i, (msg) => this.handleCheckIn(msg)); // Updated command handler
    this.bot.onText(/\/check\s*out|How can I check out/i, (msg) => this.handleCheckOut(msg)); // New command handler
    this.bot.onText(/How can I get my access code?/, (msg) => this.handleAccessCode(msg));
    this.bot.onText(/thank\s*you|Bye/i, (msg) => this.handleThankYou(msg));
  }

  private handleStart(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;

    this.bot.sendSticker(chatId, this.helloStickerId).then(() => {
      // Check if the user has already selected a language
      const selectedLanguage = this.getUserLanguage(msg.from.id);

      if (selectedLanguage) {
        this.sendMessage(
          chatId,
          `Welcome back, ${msg.from.first_name}! How can I assist you today?`,
          this.getKeyboard()
        ).then(r => {
          console.log({ r });
        });
      } else {
        // User hasn't selected a language, offer language selection keyboard
        this.sendMessage(
          chatId,
          `Hello, ${msg.from.first_name}! Please select your preferred language:`,
          this.getLanguageKeyboard()
        ).then(() => {
          // Listen for the user's reply to the language selection message
          this.bot.once("text", (replyMsg) => {
            const userId = replyMsg.from.id;
            const selectedLanguage = replyMsg.text;

            // Save the user's language
            this.setUserLanguage(userId, chatId, selectedLanguage);
          });
        });
      }
    });
  }

  private handleCheckIn(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;
    const selectedLanguage = this.getUserLanguage(msg.from.id);
    console.log({ selectedLanguage });
    let response = `*You only need:*\n- Your ID, booking reference, and approx. 5 minutes\n\n`;
    response += `- Here’s the link for the Online Check In: `;
    response += `[Online Check In](https://develop-www.dev.limehome.com/stay/guest-hub?lang=en)\n\n`;
    response += `* The last name must be exactly as in the original reservation.\n`;
    response += `* The Limehome booking reference is the 10-digit alphanumeric code found on the booking confirmation email.\n\n`;
    response += `Have you done everything according to the instructions but it still doesn't work? No problem. Please send us an email with a photo of your passport or ID, and we can check in for you.\n\n`;
    response += `Send an email to: [support@limehome.com](mailto:support@limehome.com)`;

    // Send the check-in instructions with style
    this.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }

  private handleCheckOut(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;
    const selectedLanguage = this.getUserLanguage(msg.from.id);

    let response = `Checking out at Limehome is very easy: just let the door of your apartment close behind you.\n\n`;
    response += `You must have left your apartment by 11:00 a.m. at the latest, and your access codes will stop working.\n\n`;
    response += `On the day of departure, you will also receive an SMS from us with a link. If you want to do us a favor, just click on this link after leaving your apartment, which will notify us that you have already left.\n\n`;
    response += `If you need an invoice for your stay, you can find more information [here](#).\n`;

    // Send the check-out instructions
    this.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }

  private handleHelp(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;
    const helpLink = "https://help.limehome.com/en";

    let response = `For assistance and more information, please visit our help center:\n\n`;
    response += `[Limehome Help Center](${helpLink})`;

    // Send the help information
    this.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }

  private handleThankYou(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;

    this.bot.sendSticker(chatId, this.byeStickerId).then(() => {
      this.sendMessage(chatId, `You're welcome!`);
    });
  }

  private sendMessage(chatId: number, text: string, options?: any): Promise<TelegramBot.Message> {
    return this.bot.sendMessage(chatId, text, options);
  }

  private getKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: "How can I check in?" }, { text: "How can I check out?" }],
          [{ text: "How can I get my access code?" }, { text: "How can I extend my stay?" }],
          [{ text: "How can I cancel my reservation?" }, { text: "More help" }]
        ],
        resize_keyboard: true
      }
    };
  }

  private getLanguageKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: "English" }, { text: "German" }, { text: "Spanish" }]
        ],
        resize_keyboard: true,
        force_reply: true
      }
    };
  }

  private getUserLanguage(userId: number): string | null {
    return this.userLanguages[userId] || null;
  }

  private setUserLanguage(userId: number, chatId: number, language: string): void {
    if (language === "English" || language === "German" || language === "Spanish") {
      this.userLanguages[userId] = language;

      // Send the welcome message
      this.sendMessage(
        chatId,
        `Great! You have selected ${language} as your preferred language. How can I help you?`,
        this.getKeyboard()
      );

    } else {
      // set english as default language
      this.userLanguages[userId] = "English";

      // Send the welcome message
      this.sendMessage(
        chatId,
        `Sorry, I didn't understand that. I have set English as your preferred language. How can I help you?`,
        this.getKeyboard()
      ).then(r => {
        console.log({ r });
      });
    }

  }

  private handleAccessCode(msg: TelegramBot.Message): void {
    const chatId = msg.chat.id;

    // Acknowledge the access code request with typing animation
    this.bot.sendChatAction(chatId, "typing");

    setTimeout(() => {
      const acknowledgment = `After checking your personal data from the obligatory online check-in, which must be completed before arrival, your personal access codes are visible to you on the day of arrival from 3 p.m. in our GuestHub. Thanks to our electronic access system, your apartment is ready for occupancy at any time after 3 p.m.`;

      // Send the acknowledgment
      this.sendMessage(chatId, acknowledgment).then(() => {
        // Offer more help to guide the user through the access code retrieval process
        const moreHelp = "Let me know if you still need help getting your access code.";

        // Add a typing animation before sending the "moreHelp" message
        this.bot.sendChatAction(chatId, "typing");

        setTimeout(() => {
          this.sendMessage(chatId, moreHelp, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Yes", callback_data: "yes" }, { text: "No", callback_data: "no" }]
              ]
            }
          }).then(() => {
            // Listen for the user's reply to the access code request
            this.bot.once("callback_query", (replyMsg) => {
              const userId = replyMsg.from.id;
              const selectedOption = replyMsg.data;

              if (selectedOption === "yes") {
                // Simulate typing before asking for reservation ID
                this.bot.sendChatAction(chatId, "typing");

                setTimeout(() => {
                  // User needs help, ask for reservation ID
                  this.sendMessage(chatId, "Please, provide your reservation ID number.", {
                    reply_markup: {
                      force_reply: true
                    }
                  }).then((msg) => {
                    this.bot.onReplyToMessage(msg.chat.id, msg.message_id, (msg) => {
                      // Simulate typing before asking for last name
                      this.bot.sendChatAction(chatId, "typing");

                      setTimeout(() => {
                        this.sendMessage(chatId, "Please provide the last name of the reservation booker", {
                          reply_markup: {
                            force_reply: true
                          }
                        }).then((msg) => {
                          this.bot.onReplyToMessage(msg.chat.id, msg.message_id, (msg) => {
                            // Simulate typing before providing access code
                            this.bot.sendChatAction(chatId, "typing");

                            setTimeout(() => {
                              // send sticker
                              this.bot.sendSticker(chatId, this.getAccessCodeStickerId).then(() => {
                                this.sendMessage(chatId, "Thank you for the information. Please wait while I check the details of your reservation.")
                                  .then((msg) => {
                                    // Simulate typing before providing access code
                                    this.bot.sendChatAction(chatId, "typing");

                                    setTimeout(() => {
                                      // send sticker
                                      this.bot.sendSticker(chatId, this.bananaStickerId).then(() => {
                                        this.sendMessage(chatId, "Great news! I found your reservation. Your access code is 123456.\n\nPlease let me know if you need anything else. ^_^");
                                      });
                                    }, 5000);
                                  });
                              });
                            }, 1500);
                          });
                        });
                      }, 1500);
                    });
                  });
                }, 1500);
              } else {
                // send sticker
                this.bot.sendSticker(chatId, this.sadStickerId).then(() => {
                  // User doesn't need help
                  this.sendMessage(chatId, "Ok, let me know if you need anything else.");
                });
              }
            });
          });
        }, 1000);
      });
    }, 1000);
  }

}
