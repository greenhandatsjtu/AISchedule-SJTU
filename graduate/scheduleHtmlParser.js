let sectionTimes = [
    {
        section: 1,
        startTime: "08:00",
        endTime: "08:45",
    },
    {
        section: 2,
        startTime: "08:55",
        endTime: "09:40",
    },
    {
        section: 3,
        startTime: "10:00",
        endTime: "10:45",
    },
    {
        section: 4,
        startTime: "10:55",
        endTime: "11:40",
    },
    {
        section: 5,
        startTime: "12:00",
        endTime: "12:45",
    },
    {
        section: 6,
        startTime: "12:55",
        endTime: "13:40",
    },
    {
        section: 7,
        startTime: "14:00",
        endTime: "14:45",
    },
    {
        section: 8,
        startTime: "14:55",
        endTime: "15:40",
    },
    {
        section: 9,
        startTime: "16:00",
        endTime: "16:45",
    },
    {
        section: 10,
        startTime: "16:55",
        endTime: "17:40",
    },
    {
        section: 11,
        startTime: "18:00",
        endTime: "18:45",
    },
    {
        section: 12,
        startTime: "18:55",
        endTime: "19:40",
    },
    {
        section: 13,
        startTime: "19:41",
        endTime: "20:20",
    },
]

let chineseIntMap = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7,
}

function weekStr2IntList(week) {
    let weeks = []
    let range = week.split("-")
    let start = parseInt(range[0])
    let end = parseInt(range[1])
    for (let i = start; i <= end; i++) {
        weeks.push(i)
    }
    return weeks
}

function getSections(sectionStr) {
    let start = parseInt(sectionStr.split('-')[0])
    let end = parseInt(sectionStr.split('-')[1])
    let sections = []
    for (let i = start; i <= end; i++) {
        sections.push({ section: i })
    }
    return sections
}

function parseCourse(content) {
    let courses = []
    content.find('td').each(function (index) {
        switch (index) {
            case 1:
                _name = $(this).text()
                break
            case 7:
                teacher = $(this).text()
                break
            case 10:
                str = $(this).html($(this).html().replace("<br>", "\n")).text()
                strs = str.split('\n')
                for (const s of strs) {
                    let course = {}
                    course.name = _name
                    course.teacher = teacher
                    regStr = /^(\d{1,2}-\d{1,2})周\s星期(.)\[(\d{1,2}-\d{1,2})节\](.*)$/
                    results = regStr.exec(s)
                    if (results == null) {
                        continue
                    }
                    course.weeks = weekStr2IntList(results[1])
                    course.day = chineseIntMap[results[2]]
                    course.sections = getSections(results[3])
                    course.position = results[4]
                    courses.push(course)
                }
                break
        }
    })
    return courses
}

function scheduleHtmlParser(html) {
    // const $ = cheerio.load(html, { decodeEntities: false });
    let result = []
    $('tbody>tr').each(function () {
        result = result.concat(parseCourse($(this)))
    })

    return {
        courseInfos: result,
        sectionTimes: sectionTimes
    }
}