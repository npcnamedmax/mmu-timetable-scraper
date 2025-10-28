const { match } = require("./timetableMatch.cjs");
const fs = require("fs");

function validateCriteria(criteria) {
  const { isOpen, earliestTime, latestTime, numOfDays, days } = criteria;
  let numDays = numOfDays;
  let daysIsValid = false;
  if (
    days.length == 0 ||
    days.length > 5 ||
    (days[0] == "0" && days.length != 1)
  ) {
    return false;
  }
  const newSet = new Set();
  let newDays = "";

  for (const c of days) {
    if (newSet.has(c)) {
      continue;
    }
    if (c < "0" || c > "6") {
      return false;
    } else {
      newSet.add(c);
      newDays += c;
    }
  }
  daysIsValid = true;

  if (numDays == 0 && newDays[0] != "0") {
    numDays = newDays.length;
  }

  return (
    (isOpen == 0 || isOpen == 1) &&
    earliestTime >= -1 &&
    latestTime >= -1 &&
    daysIsValid &&
    numDays >= 0 &&
    numDays <= 5 &&
    (newDays[0] == "0" || numDays <= newDays.length)
  );
}

function filterSubArr(subjectArr, criteria) {
  const arr = subjectArr.filter((combination) => {
    return checkMatch(combination, criteria);
  });
  if (arr.length == 0) {
    console.log("No subjects match criteria");
    return null;
  }
  return arr;
}

function checkMatch(combination, criteria) {
  //check if a subject matches criteria
  //subject:
  /*
  {
    optionId: '22',
    classNames: [
      'Component LEC - Class Sect TC1L - Class',
      'Component TUT - Class Sect TT4L - Class'
    ],
    datetimes: [
      { day: 0, time: Interval { low: 960, high: 1080 } },
      { day: 3, time: Interval { low: 840, high: 960 } }
    ],
    status: 'Closed'
  }
  */
  //All criterias will be filtered here except numofdays, which will be filtered when matching
  const { isOpen, earliestTime, latestTime, days } = criteria;
  return (
    (isOpen == 0 || (isOpen == 1 && combination.status == "Open")) &&
    combination.datetimes.every((dt) => {
      return (
        (earliestTime == -1 || dt.time.low >= earliestTime) &&
        (latestTime == -1 || dt.time.high <= latestTime) &&
        (days == "0" || days.includes(dt.day))
      );
    })
  );
}

try {
  const jsonString = fs.readFileSync("./output.json");
  let courseDetails = JSON.parse(jsonString);

  const criteria = {
    isOpen: 1, //0 means any, 1 means open
    earliestTime: -1, //-1 means any earliest time
    latestTime: -1, //-1 means any latest time
    numOfDays: 4, //number of days in the week, 0 means any
    days: "0", //12 means tues and wed, 0 means any day
  };

  if (!validateCriteria(criteria)) {
    console.log("Invalid criteria");
    return;
  }
  // console.dir(courseDetails);
  //from here onwards, repeat if criteria changes
  for (let subject of courseDetails) {
    subject = filterSubArr(subject, criteria);
  }
  /*
    while(subjectArr == null) {
      //get input then validate
      subjectArr = filterSubArr(subjectArr, criteria); //make sure subject still has sections after filter
    }
    */
  const finalArr = match(courseDetails, criteria);
  if (finalArr.length == 0) {
    console.log("Empty result");
  } else {
    fs.writeFileSync(
      "./filtered.json",
      JSON.stringify(finalArr),
      { flag: "w+" },
      (err) => {
        if (err) {
          console.error(err);
        } else {
          // file written successfully
          console.log("Written to output.json");
        }
      },
    );
  }
} catch (e) {
  console.error(e);
}
