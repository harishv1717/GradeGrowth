import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const API_KEY = "";

export default async function getMessage(name, letter) {
    try {
        let contents = [
            {
                role: "user",
                parts: [
                    { inline_data: { mime_type: "text/plain" } },
                    {
                        text:
                            "give me a mentally empowering mental health tip that is under 50 words for someone with a " +
                            letter +
                            " in " +
                            name
                    }
                ]
            }
        ];

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                }
            ]
        });

        const result = await model.generateContentStream({ contents });

        let finalMsg = "";
        for await (let response of result.stream) {
            finalMsg += response.text();
        }

        return finalMsg;
    } catch (e) {
        return "You got this! Remember that this is only the beginning and there is always more to life." + e;
    }
}
