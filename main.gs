function scrapeDome() {
  // URL for the dome
  const url = 'https://www.kyoceradome-osaka.jp/schedule/'

  // Fetch the HTML content of the website
  const response = UrlFetchApp.fetch(url);
  const htmlContent = response.getContentText().trim();

  //Load the HTML into Cheerio
  const $ = Cheerio.load(htmlContent);

  let eventTitles = [];

  //Get the Event titles
  $('div.top > h2').each(function(index, element){
    eventTitles.push($(element).text())
  })

  console.log(eventTitles)

  //Find all the p elements with class date
  $('li.date p:not(.fwb)').each(function(index, element){

    //Extract the date
    let rawDate = $(element).text()
    let formattedDate = getDate(rawDate)
    console.log("Raw info: "+index + rawDate)

    //Extract any time information
    let times = getTime(rawDate)
    console.log(times)

    //Create the Events
    //Handle Events with no times listed
    if (Object.keys(times).length === 0){
      let beginning = makeDateTime(formattedDate, "08:00")
      let end = makeDateTime(formattedDate, "09:00")
      //Get the Event Title
      let title = "(No Event Times Listed) " + eventTitles[index]
      console.log(title)
      console.log("Event with no times listed!")
      console.log(beginning + " "+ end)
      //Run Event Function Here
      createCalendarEvent(title, beginning, end)
    } else {
      //Handle events with opening times
      if (times.open){
        let beginning = makeDateTime(formattedDate, times.open)
        let end = makeDateTime(formattedDate, times.start)
        //Get the Event Title
        let title = "(Doors Open) " + eventTitles[index]
        console.log(title)
        console.log("Doors Opening Event")
        console.log(beginning + " "+ end)
        //Run Event Function Here
        createCalendarEvent(title, beginning, end)
      }
      if (times.end){
        //Handle events with start and end times
        let beginning = makeDateTime(formattedDate, times.start)
        let end = makeDateTime(formattedDate, times.end)
        //Get the Event Title
        let title = eventTitles[index]
        console.log(title)
        console.log("Event with Begining and End Time")
        console.log(beginning + " "+ end)
        //Run Event Function Here
        createCalendarEvent(title, beginning, end)
      } else {
        //Handle Events with just start times
        let beginning = makeDateTime(formattedDate, times.start)
        let end = makeDateTime(formattedDate, times.start)
        end.setHours(end.getHours()+3); //Based on average baseball game lenght.
        //Get the Event Title
        let title = eventTitles[index]
        console.log("(No End Time Listed) "+title)
        console.log("Event with indeterminate end time ")
        console.log(beginning + " "+ end)
        //Run Event Function Here
        createCalendarEvent(title, beginning, end)
      }
    }
  })
}

function getDate(japaneseDate){
  const string = japaneseDate.match(/(\d{4})年(\d{2})月(\d{2})日/)
  const year = string[1]
  const month = string[2]
  const day = string[3]

  formattedDate = year + '-' + month + '-' + day;
  return formattedDate
}

function getTime(inputString) {
  const timeRegex = /(?:開場|開始)時間：(\d{1,2}:\d{2})(?=.*～)/g;
  var matches, extractedTimes = {};

  while ((matches = timeRegex.exec(inputString)) !== null) {
    var label = matches[0].includes("開場") ? "open" : "start";
    var timeValue = matches[1];

    //Add a leading zero to single-digit hours
    var [hours, minutes] = timeValue.split(':');
    hours = hours.padStart(2, '0'); // Ensure two digits
    timeValue = `${hours}:${minutes}`;

    extractedTimes[label] = timeValue;
  }

  // Extract the final time value (if present)
  var finalTimeMatch = inputString.match(/(?:\d{1,2}:\d{2})～(\d{1,2}:\d{2})/);
  if (finalTimeMatch) {
    //Add a leading zero to single-digit hours
    var [hours, minutes] = timeValue.split(':');
    hours = hours.padStart(2, '0'); // Ensure two digits
    timeValue = `${hours}:${minutes}`;

    extractedTimes["end"] = finalTimeMatch[1];
  }

  return extractedTimes;
}

function makeDateTime(date, time){
  //console.log("Raw Dates and times: " + date +"," + time)
  let dateTimeString = new Date(date+'T'+time+':00')
  //console.log("Date string: " + dateTimeString)
  return dateTimeString
}

// const title = "test event";
// const startTime = new Date("2023-08-07T11:00:00");
// const endTime = new Date("2023-08-07T15:00:00");

function createCalendarEvent(title, startTime, endTime) {
  const calendar = CalendarApp.getCalendarById('e20b0bf86aa3bc709e22e075dc29e92163de9b186b9d5229b59b8f3fec77d793@group.calendar.google.com');
  //Test
  //const calendar = CalendarApp.getCalendarById('47d63b14013617e5df660de28be59e2e901a01792c30b2b518172eaeade443d4@group.calendar.google.com')

  let event = calendar.createEvent(title, startTime, endTime);
  Logger.log("Event created: " + event.getTitle());
}