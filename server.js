const cheerio = require("cheerio");

const axios = require("axios");
axios.defaults.baseURL = "https://parents.sbschools.org/genesis";

const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
};

const WebSocket = require("ws");

const login = async body => {
    const j_username = body?.username;
    const j_password = body?.password;

    const loginHeaders = headers;
    loginHeaders["Cookie"] = (await axios.get("/sis/view?gohome=true", { headers })).headers["set-cookie"];

    const data = { j_username, j_password };
    await axios.post("/sis/j_security_check", data, { headers });

    return loginHeaders;
};

const schedule = async body => {
    await axios.get(`/parents?tab1=studentdata&tab2=studentsummary&studentid=${body.studentId}&action=form`, {
        headers: body.loginData
    });

    const url = `/parents?tab1=studentdata&tab2=studentsummary&action=ajaxGetBellScheduleForDateJsp&studentid=${body.studentId}&scheduleDate=${body.date}&schedView=daily&mpToView=${body.mp}`;
    const r = await axios.get(url, { headers: body.loginData });

    const html = r.data;
    const $ = cheerio.load(html);

    const schedule = [];
    const rows = $(".listrow").toArray();

    for (const row of rows) {
        const c1 = $(row).children().toArray()[0];
        const c2 = $(row).children().toArray()[1];

        const block = $(c1).children().first().children().first().text().split(" ")[1];
        const startTime = $($(c1).children().toArray()[1]).text();
        const endTime = $($(c1).children().toArray()[2]).text();

        const className = $(c2).children().first().children().first().text();
        const teacher = $($(c2).children().toArray()[1]).text();
        const room = $($(c2).children().toArray()[2]).text().split(" ")[1];

        schedule.push({
            className,
            teacher,
            room,
            block,
            startTime,
            endTime
        });
    }

    return schedule;
};

const grades = async body => {
    await axios.get(`/parents?tab1=studentdata&tab2=studentsummary&studentid=${body.studentId}&action=form`, {
        headers: body.loginData
    });

    const url = `/parents?tab1=studentdata&tab2=gradebook&tab3=weeklysummary&action=form&studentid=${body.studentId}&mpToView=${body.mp}`;
    const r = await axios.get(url, { headers: body.loginData });

    const html = r.data;
    const $ = cheerio.load(html);

    const classGrades = [];

    const subjects = $("span[class^='categorytab']");
    const subjectArr = [];
    for (let i = 0; i < subjects.length; i++) {
        subjectArr.push($(subjects.get(i)).text().trim());
    }

    const grades = $("span[style^='font-size:11pt']");
    const gradeArr = [];
    for (let i = 0; i < subjects.length; i++) {
        gradeArr.push($(grades.get(i)).text().trim());
    }

    for (let i = 0; i < subjectArr.length; i++) classGrades.push([subjectArr[i], parseInt(gradeArr[i])]);
    return classGrades;
};

const basicInfo = async body => {
    await axios.get(`/parents?tab1=studentdata&tab2=studentsummary&studentid=${body.studentId}&action=form`, {
        headers: body.loginData
    });

    const url = `/parents?tab1=studentdata&tab2=studentsummary&action=form&studentid=${body.studentId}`;
    const r = await axios.get(url, { headers: body.loginData });

    const html = r.data;
    const $ = cheerio.load(html);

    const name = $("span[style^='font-weight: 100;']");
    return $($("div[style^='display: flex;align-items: center']")).text().trim().replace(/\s+/, " ");
};

const wsServer = new WebSocket.WebSocketServer({
    port: 4000
});

wsServer.on("connection", function (ws) {
    ws.on("message", async function (msg) {
        const loginData = await login(JSON.parse(msg)[0]);
        ws.send(
            JSON.stringify([
                await schedule({
                    loginData,
                    studentId: JSON.parse(msg)[1],
                    date: JSON.parse(msg)[2],
                    mp: "MP4"
                }),
                await grades({ loginData, studentId: JSON.parse(msg)[1], mp: "FG" }),
                await basicInfo({ loginData, studentId: JSON.parse(msg)[1] })
            ])
        );
    });
});
