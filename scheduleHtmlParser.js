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
        startTime: "19:40",
        endTime: "20:20",
    },
    {
        section: 14,
        startTime: "20:20",
        endTime: "21:00",
    },
]

function weekStr2IntList(week) {
    // 将全角逗号替换为半角逗号
    let reg = new RegExp("，", "g");
    week.replace(reg, ',');
    let weeks = [];

    // 以逗号为界分割字符串，遍历分割的字符串
    // consider the special condition: 1,4,7,15-16
    week.split(",").forEach(w => {
        if (w.search('-') !== -1) {
            let range = w.split("-");
            let start = parseInt(range[0]);
            let end = parseInt(range[1]);
            for (let i = start; i <= end; i++) {
                if (!weeks.includes(i)) {
                    weeks.push(i);
                }
            }
        } else if (w.length !== 0) {
            let v = parseInt(w);
            if (!weeks.includes(v)) {
                weeks.push(v);
            }
        }
    });
    return weeks;
}

function getSections(sectionStr) {
    let start = parseInt(sectionStr.split('-')[0])
    let end = parseInt(sectionStr.split('-')[1])
    let sections = []
    for (let i = start; i <= end; i++) {
        sections.push({section: i})
    }
    return sections
}

function getTime(str) {
    let weeksIndex = str.indexOf(')') + 1
    let weekStr = str.substr(weeksIndex).replace(/周/gi, '') // "1,4,7,15-16"
    let weeks = getWeeks(weekStr)

    let reg = /(\d{1,2}-\d{1,2})节/
    let sectionStr = reg.exec(str)[1] // "7-8"
    let sections = getSections(sectionStr)

    return {
        weeks: weeks,
        sections: sections
    }
}

function getWeeks(weekStr) {
    let flag = 0
    if (weekStr.search('单') !== -1) {
        flag = 1
    } else if (weekStr.search('双') !== -1) {
        flag = 2
    }
    let weeks = weekStr2IntList(weekStr)
    weeks = weeks.filter((v) => {
        if (flag === 1) { // 单周
            return v % 2 === 1
        } else if (flag === 2) { // 双周
            return v % 2 === 0
        }
        return v
    })
    return weeks
}

// 解析列表模式
function parseList(html) {
    let result = []
    let cache = [] // cache for sections
    const $ = cheerio.load(html, {decodeEntities: false});
    $('#kblist_table').find('tbody[id]').each(function (weekday) {
        $(this).find('tr').each(function (index) {
            if (index > 0) {
                let course = {}
                let hasSections = false
                $(this).find('td').each(function (i) {
                    if (i === 0 && $(this).has('.festival').length > 0) {
                        course.sections = getSections($(this).text())
                        hasSections = true
                        cache = course.sections // 节数存入cache备用（单双周情况）
                    } else {
                        if (!hasSections) {
                            // 如果没有课程节数，说明和上一门课在同一时间（单双周），读取cache即可
                            course.sections = cache
                        }
                        course.name = $(this).find('.title').text()
                        course.name = course.name.substr(0, course.name.length - 1) // 去掉末尾的标志
                        $(this).find('p font').each(function (index) {
                            switch (index) {
                                case 0:
                                    course.weeks = getWeeks($(this).text().split('：')[1].replace(/周/gi, ''))
                                    break
                                case 1:
                                    let temp = $(this).text().trim().split(/：|\s/)
                                    course.position = temp[3] // 因为显示不全，所以不取校区信息，只取教室
                                    break
                                case 2:
                                    course.teacher = $(this).text().split('：')[1]
                                    break
                                default:
                                    return false
                            }
                        })
                        course.day = weekday + 1
                    }
                })
                result.push(course)
            }
        })
    })
    console.log(result)
    return result
}

// 解析表格模式
function parseTable(html) {
    const $ = cheerio.load(html, {decodeEntities: false});
    let result = []
    $('#kbgrid_table_0').find('td').each(function () {
        if ($(this).hasClass('td_wrap') && $(this).text().trim() !== '') {
            let info = []
            let weekday = parseInt($(this).attr('id').split('-')[0])
            $(this).find('font').each(function () {
                let text = $(this).text().trim()
                if (text !== '') {
                    info.push(text)
                }
            })
            let hasNext = true
            let index = 0
            while (hasNext) {
                let course = {}
                course.name = info[index].substr(0, info[index].length - 1)
                course.teacher = info[index + 3]
                course.position = info[index + 2].split(/\s/)[1] // 因为显示不全，所以不取校区信息，只取教室
                course.day = weekday

                courseInfo = getTime(info[index + 1])
                course.weeks = courseInfo.weeks
                course.sections = courseInfo.sections

                result.push(course)

                if (info[index + 11] !== undefined) {
                    index += 11 // 同一个td内存在多门课（单双周）
                } else {
                    hasNext = false
                }
            }
        }
    })
    console.log(result)
    return result
}

function scheduleHtmlParser(html) {
    let result = []

    if ($('#type').text() === 'list') {
        result = parseList(html)
    } else {
        result = parseTable(html)
    }

    console.log(result.length)

    return {
        courseInfos: result,
        sectionTimes: sectionTimes
    }
}
