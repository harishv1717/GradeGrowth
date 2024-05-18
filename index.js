const url = "ws://localhost:4000/";
const mywsServer = new WebSocket(url);

import getMessage from "./tips.js";

const get = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    const password = urlParams.get("password");

    const date = document.getElementById("scheduledate").value.split("-");
    date.push(date.shift());
    console.log(date);

    mywsServer.send(JSON.stringify([{ username, password }, username.split("@")[0], date.join("/")]));
    document.body.innerHTML = `<input type="date" id="scheduledate" value="${document
        .getElementById("scheduledate")
        .value.trim()}" /><button id="enterdate">Enter Date</button><h1 id="name">Hi, ${
        document.getElementById("name").innerHTML
    }</h1><h1 id="gradelink">Grades</h1>
        <h1 id="schedulelink">Schedule</h1>

        <div class="wrapper">
            <div id="schedule"></div>
            <script src="index.js"></script>
        </div>
        <div class="wrapper">
            <div id="grades"></div>
        </div>`;
};

mywsServer.onopen = get;

document.addEventListener("click", event => {
    if (event.target.id == "enterdate") get();
});

mywsServer.onmessage = async function (event) {
    const { data } = event;
    console.log(data);

    document.getElementById("name").innerHTML = "Hi, " + JSON.parse(data)[2];

    if (JSON.parse(data)[0].length) {
        for (const classElem of JSON.parse(data)[0]) {
            const elem = document.createElement("div");
            elem.setAttribute("class", "classinfo");

            const name = document.createElement("span");
            name.innerHTML = classElem.className;
            name.setAttribute("class", "classname");
            elem.appendChild(name);
            elem.appendChild(document.createElement("br"));

            if (classElem.teacher.length) {
                const teacher = document.createElement("span");
                teacher.innerHTML = `Teacher: ${classElem.teacher}`;
                teacher.setAttribute("class", "teacher");
                elem.appendChild(teacher);
                elem.appendChild(document.createElement("br"));
            }

            if (classElem.room.length) {
                const room = document.createElement("span");
                room.innerHTML = `Room: ${classElem.room}`;
                room.setAttribute("class", "room");
                elem.appendChild(room);
                elem.appendChild(document.createElement("br"));
            }

            const block = document.createElement("span");
            block.innerHTML = `Block: ${classElem.block} (${classElem.startTime}-${classElem.endTime})`;
            block.setAttribute("class", "timing");
            elem.appendChild(block);
            elem.appendChild(document.createElement("br"));
            elem.appendChild(document.createElement("br"));

            document.getElementById("schedule").appendChild(elem);
        }
    }

    for (const gradeElem of JSON.parse(data)[1]) {
        console.log(gradeElem);
        const elem = document.createElement("div");
        elem.setAttribute("class", "classinfo");

        const name = document.createElement("span");
        name.innerHTML = gradeElem[0];
        name.setAttribute("class", "classname");
        elem.appendChild(name);
        elem.appendChild(document.createElement("br"));

        const grade = document.createElement("span");
        grade.innerHTML = "Grade: " + gradeElem[1] + "%" + getLetterGrade(gradeElem[1]);
        grade.setAttribute("class", "teacher");
        elem.appendChild(grade);
        elem.appendChild(document.createElement("br"));

        const tip = document.createElement("span");
        tip.innerHTML = await getMessage(gradeElem[0], getLetterGrade(gradeElem[1]).replace("(", "").replace(")", ""));
        tip.setAttribute("class", "tip");
        elem.appendChild(tip);
        elem.appendChild(document.createElement("br"));
        elem.appendChild(document.createElement("br"));

        document.getElementById("grades").appendChild(elem);
    }
};

const getLetterGrade = grade => {
    if (grade >= 93) return " (A)";
    else if (grade >= 90) return " (A-)";
    else if (grade >= 87) return " (B+)";
    else if (grade >= 83) return " (B)";
    else if (grade >= 80) return " (B-)";
    else if (grade >= 77) return " (C+)";
    else if (grade >= 73) return " (C)";
    else if (grade >= 70) return " (C-)";
    else if (grade >= 65) return " (D)";
    else if (grade > 0) return " (F)";
    else return "";
};
