import 'dotenv/config';
const gebruikersnaam = process.env.USERNAME;
const wachtwoord = process.env.PASSWORD;
const sg_ofset = process.env.OFFSET;
const wacht = process.env.WAIT;
const cooldown_in_min = process.env.COOLDOWN;
let token_vernieuwen_datum;
let token;

async function get_token() {
    if (token_vernieuwen_datum == null) {
        token_vernieuwen_datum = 1;
    }

    if (token_vernieuwen_datum <= Number(Date.now().toString().slice(0, 10)) || negeer_token_vernieuwen_datum) {

        const response = await fetch(
            "https://api.wrts.nl/api/v3/auth/get_token?email=" + gebruikersnaam + "&password=" + wachtwoord,
            {
                method: "POST",
                redirect: "follow"
            }
        );

        const result = await response.json();

        // Update localStorage
        token = result.auth_token.toString();
        token_vernieuwen_datum = Number(result.renew_from);
        return result.auth_token.toString();

    } else { return token; }
}
async function like(id, token) {
    await fetch("https://api.wrts.nl/api/v3/qna/answers/" + id + "/votes", {
        "credentials": "omit",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/json",
            "X-Auth-Token": token,
        },
        "referrer": "https://studygo.com/",
        "method": "POST",
        "mode": "cors"
    });
}
async function main() {
    console.log("token ophalen...");
    token = await get_token();
    console.log("forum ophalen...");
    const forum = await fetch("https://api.wrts.nl/api/v3/public/qna/questions", {
        "credentials": "omit",
        "headers": {
            "Accept": "application/json, text/plain, */*",
        },
        "referrer": "https://studygo.com/",
        "method": "GET",
        "mode": "cors"
    });
    console.log("vraag ophalen...");
    const forum_data = await forum.json();
    const forum_item = await fetch("https://api.wrts.nl/api/v3/public/qna/questions/" + forum_data.results[sg_ofset].id, {
        "credentials": "omit",
        "headers": {
            "Accept": "application/json, text/plain, */*",
        },
        "referrer": "https://studygo.com/",
        "method": "GET",
        "mode": "cors"
    });
    const forum_item_data = await forum_item.json();
    const qna = forum_item_data.qna_question;
    const antworden = await qna.other_qna_answers;
    console.log("likes sturen...");
    for (const antwoord of antworden) {
        await like(antwoord.id, token);
        await new Promise(resolve => setTimeout(resolve, wacht));
    }

    // loop
    console.log("cooldown begint");
    await new Promise(resolve => setTimeout(resolve, cooldown_in_min * 60 * 1000));
    main();
}

main();