var lectures = [];
var quizzs = [];
var courseId = null;
let completed_lecture_ids = [];
let completed_quiz_ids = [];
let completed_assignment_ids = [];
const ROOT_URL = "https://" + location.host;

const divElement = document.querySelector('div[data-module-id="course-taking"]');
if (divElement) {
    const moduleArgs = JSON.parse(divElement.getAttribute('data-module-args'));
    console.log("moduleArgs", moduleArgs);
    courseId = moduleArgs.courseId;
} else {
    console.error('element with data-module-id "course-taking" not exist.');
}
console.log("Course Id", courseId);

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

        const data = await response.json();
        lectures = data.results.filter(e => e._class === "lecture" && !completed_lecture_ids.includes(e.id));
        quizzs = data.results.filter(e => e._class === "quiz" && !completed_quiz_ids.includes(e.id));
        console.log("lectures list", lectures);
        console.log("quizzs list", quizzs);

        for (const lecture of lectures) {
            await fetchLectures(courseId, lecture.id);
        }

        for (const quizz of quizzs) {
            await fetchQuizz(courseId, quizz.id);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function fetchLectures(courseId, lectureId) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Đợi 3 giây trước khi fetch
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