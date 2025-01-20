const progressFill = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
let progress = 0;

const initProgress = async () => {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const tabId = tab.id;

        await chrome.scripting.executeScript({
            target: { tabId },
            func: getProgress,
        });
    } catch (error) {
        console.error(error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateProgress") {
        progress += request.progressIndex;
        if (progress >= 100) {
            progress = 100;
            const button = document.getElementById('progressBtn');
            const loadingFetchData = document.getElementById('loadingFetchData');
            const courseCompleted = document.getElementById('courseCompleted');
            loadingFetchData.style.display = 'none';
            button.style.display = 'none';
            courseCompleted.style.display = 'block';
        }
        progressFill.style.width =
            `${progress}%`;
        progressText.textContent =
            `${Math.round(progress)}%`;
    } else if (request.action === "enableButtonProgress") {
        const button = document.getElementById('progressBtn');
        const loadingFetchData = document.getElementById('loadingFetchData');
        const courseCompleted = document.getElementById('courseCompleted');
        loadingFetchData.style.display = 'none';
        if (progress >= 100) courseCompleted.style.display = 'block';
        else button.style.display = 'block';
    } else if (request.action === "progressing") {
        const button = document.getElementById('progressBtn');
        const loadingFetchData = document.getElementById('loadingFetchData');
        loadingFetchData.style.display = 'block';
        button.style.display = 'none';
    }
});

const getProgress = () => {
    const ROOT_URL = "https://" + location.host;
    var lectures = [];
    var quizzs = [];
    var courseId = null;
    let completed_lecture_ids = [];
    let completed_quiz_ids = [];
    let completed_assignment_ids = [];
    let progressIndex = 0;

    const divElement = document.querySelector('div[data-module-id="course-taking"]');
    if (divElement) {
        const moduleArgs = JSON.parse(divElement.getAttribute('data-module-args'));
        console.log("moduleArgs", moduleArgs);
        courseId = moduleArgs.courseId;
    } else {
        console.error('element with data-module-id "course-taking" not exist.');
    }
    console.log("Course Id", courseId);

    const updateProgressBar = (progressIndex) => {
        chrome.runtime.sendMessage({ action: "updateProgress", progressIndex: progressIndex });
    };

    const enableButtonProgress = () => {
        chrome.runtime.sendMessage({ action: "enableButtonProgress" });
    };

    async function fetchCourse(courseId) {
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/courses/${courseId}/subscriber-curriculum-items/?page_size=1000&fields[lecture]=title,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free&fields[quiz]=title,object_index,is_published,sort_order,type&fields[practice]=title,object_index,is_published,sort_order&fields[chapter]=title,object_index,is_published,sort_order&fields[asset]=title,filename,asset_type,status,time_estimation,is_external&caching_intent=True`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            lectures = data.results.filter(e => e._class === "lecture");
            quizzs = data.results.filter(e => e._class === "quiz");
            console.log("lectures list", lectures);
            console.log("quizzs list", quizzs);

            progressIndex = 100 / (lectures.length + quizzs.length);

            fetchProgress(courseId);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    async function fetchProgress(courseId) {
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/users/me/subscribed-courses/${courseId}/progress/?fields[course]=completed_lecture_ids,completed_quiz_ids,last_seen_page,completed_assignment_ids,first_completion_time`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log("course progress data", data);
            completed_lecture_ids = data.completed_lecture_ids;
            completed_quiz_ids = data.completed_quiz_ids;
            completed_assignment_ids = data.completed_assignment_ids;

            let progressCompleted = (completed_lecture_ids.length + completed_quiz_ids.length + completed_assignment_ids.length) * progressIndex;
            updateProgressBar(progressCompleted);
            enableButtonProgress();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    fetchCourse(courseId);
}

const progressCourse = () => {
    const ROOT_URL = "https://" + location.host;
    var lectures = [];
    var quizzs = [];
    var courseId = null;
    let completed_lecture_ids = [];
    let completed_quiz_ids = [];
    let completed_assignment_ids = [];
    let progressIndex = 0;

    const divElement = document.querySelector('div[data-module-id="course-taking"]');
    if (divElement) {
        const moduleArgs = JSON.parse(divElement.getAttribute('data-module-args'));
        console.log("moduleArgs", moduleArgs);
        courseId = moduleArgs.courseId;
    } else {
        console.error('element with data-module-id "course-taking" not exist.');
    }
    console.log("Course Id", courseId);

    const updateProgressBar = (progressIndex) => {
        chrome.runtime.sendMessage({ action: "updateProgress", progressIndex: progressIndex });
    };

    async function fetchProgress(courseId) {
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/users/me/subscribed-courses/${courseId}/progress/?fields[course]=completed_lecture_ids,completed_quiz_ids,last_seen_page,completed_assignment_ids,first_completion_time`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Update progress status into Popup
            chrome.runtime.sendMessage({ action: "progressing", progressIndex: progressIndex });

            const data = await response.json();
            console.log("course progress data", data);
            completed_lecture_ids = data.completed_lecture_ids;
            completed_quiz_ids = data.completed_quiz_ids;
            completed_assignment_ids = data.completed_assignment_ids;

            fetchCourse(courseId);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    async function fetchCourse(courseId) {
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/courses/${courseId}/subscriber-curriculum-items/?page_size=1000&fields[lecture]=title,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free&fields[quiz]=title,object_index,is_published,sort_order,type&fields[practice]=title,object_index,is_published,sort_order&fields[chapter]=title,object_index,is_published,sort_order&fields[asset]=title,filename,asset_type,status,time_estimation,is_external&caching_intent=True`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            let data = await response.json();
            data = data.results;

            lectures = data.filter(e => e._class === "lecture" && !completed_lecture_ids.includes(e.id));
            quizzs = data.filter(e => e._class === "quiz" && !completed_quiz_ids.includes(e.id));
            console.log("lectures list", lectures);
            console.log("quizzs list", quizzs);

            const dataFetchs = data.filter(e => lectures.map(l => l.id).includes(e.id) || quizzs.map(q => q.id).includes(e.id));
            progressIndex = 100 / data.filter(e => e._class === "lecture" || e._class === "quiz").length;

            for (const section of dataFetchs) {
                if (section._class === "lecture")
                    await fetchLectures(courseId, section.id);
                else if (section._class === "quiz")
                    await fetchQuizz(courseId, section.id);
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    async function fetchLectures(courseId, lectureId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/users/me/subscribed-courses/${courseId}/completed-lectures/`, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US",
                    "content-type": "application/json",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `{\"lecture_id\":${lectureId},\"downloaded\":false}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });

            if (response.ok) {
                console.log(`Fetch successful for lecture ${lectureId}`);
            } else {
                console.error(`Fetch failed for lecture ${lectureId}`);
            }
            updateProgressBar(progressIndex);
        } catch (error) {
            console.error(`Error fetching for lecture ${lectureId}: ${error}`);
        }
    }

    async function fetchQuizz(courseId, quizzId) {
        try {
            const response = await fetch(`${ROOT_URL}/api-2.0/quizzes/${quizzId}/assessments/?version=1&page_size=1000&fields[assessment]=id,assessment_type,prompt,correct_response,section,question_plain,related_lectures&use_remote_version=true`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            let asssessments = data.results;
            console.log("asssessments list", asssessments);

            const responseUserAttemptedQuizzes = await fetch(`${ROOT_URL}/api-2.0/users/me/subscribed-courses/${courseId}/quizzes/${quizzId}/user-attempted-quizzes/?fields[user_attempted_quiz]=id,created,viewed_time,completion_time,version,completed_assessments,results_summary`, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US",
                    "content-type": "application/json",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": "{\"is_viewed\":true,\"version\":1}",
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });

            if (!responseUserAttemptedQuizzes.ok) {
                throw new Error('Network response was not ok');
            }

            let userAttemptedQuizzes = await responseUserAttemptedQuizzes.json();
            console.log("userAttemptedQuizzes", userAttemptedQuizzes);

            for (const asssessment of asssessments) {
                await fetchAsssessment(asssessment, userAttemptedQuizzes);
            }
            updateProgressBar(progressIndex);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    async function fetchAsssessment(asssessment, userAttemptedQuizzes) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Đợi 3 giây trước khi fetch
        try {
            const correctResponse = '[' + asssessment.correct_response.map(item => `\\"${item}\\"`).join(', ') + ']';
            const response = await fetch(`${ROOT_URL}/api-2.0/users/me/subscribed-courses/${courseId}/user-attempted-quizzes/${userAttemptedQuizzes.id}/assessment-answers/?fields[user_answers_assessment]=id,response,assessment,is_marked_for_review,score`, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US",
                    "content-type": "application/json",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `{\"assessment_id\":${asssessment.id},\"response\":\"${correctResponse}\",\"duration\":2}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });

            if (response.ok) {
                console.log(`Fetch successful for asssessment ${asssessment.id}`);
            } else {
                console.error(`Fetch failed for asssessment ${asssessment.id}`);
            }
        } catch (error) {
            console.error(`Error fetching for asssessment ${asssessment.id}: ${error}`);
        }
    }

    fetchProgress(courseId);
}

document.getElementById('progressBtn').addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const tabId = tab.id;

        await chrome.scripting.executeScript({
            target: { tabId },
            func: progressCourse,
        });
    } catch (error) {
        console.error(error);
    }
});

document.getElementsByTagName("BODY")[0].onclick = function (e) {
    e = e || event;
    var target = e.target || e.srcElement;
    if (target.nodeName != "A") return;
    var href = target.href;
    chrome.tabs.create({ url: href });
    return false;
};

initProgress();