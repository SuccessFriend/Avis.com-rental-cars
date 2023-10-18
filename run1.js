const puppeteer = require('puppeteer');
// var cookie = require('cookie-parse');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const e = require("express");

let givenDate = process.argv[2];

// Read the text file
const filePath = 'location origin.csv';
const text = fs.readFileSync(filePath, 'utf8');

// Perform scraping logic on the text data
// Here's an example of counting the number of lines in the text file
const lines = text.split('\n');

let searchKey = null;
let start_date = null;
let end_date = null;
// let index = 0;


  
// for (let i = 1; i < 31; i++) {
    // console.log(">>> ", i);
    // const start_date = new Date(givenDate);
    const newDate = new Date(givenDate);
    // newDate.setDate(newDate.getDate() + i);
    const startDate = newDate.toISOString().split('T')[0];
    start_date = startDate.split("-")[1] + "/" + startDate.split("-")[2] + "/" + startDate.split("-")[0];
    newDate.setDate(newDate.getDate() + 330);
    const endDate = newDate.toISOString().split('T')[0];
    end_date = endDate.split("-")[1] + "/" + endDate.split("-")[2] + "/" + endDate.split("-")[0];
    
    // Create CSV Writer
    const csvWriter = createCsvWriter({
        path: 'Result'+givenDate+'.csv',
        header: [
            { id: 'Number', title: 'Number' },
            { id: 'Name', title: 'Name' },
            { id: 'Type', title: 'Type' },
            { id: 'PayLater', title: 'PayLater' },
            { id: 'PayLaterTotal', title: 'PayLaterTotal' },
            // { id: 'KY Number', title: 'KY Number' },
            // { id: 'Island', title: 'Island' },
            // { id: 'Phone +1', title: 'Phone +1' }
        ],
        append: false
    });
    
    for (row in lines) {
        const searchKeyMiddle = lines[row].split("/");
        searchKey = searchKeyMiddle[searchKeyMiddle.length - 1].split(",")[0];
        // console.log("start date >>> ", start_date);
        // console.log("end date >>> ", end_date);
        // console.log("searchKey >>> ", searchKey);
        
        // index = index + 1;
        // console.log("------------", index, "---------------");

        ///////////////////////////// put here the scraping code

        /////////////////////////////
    }
// }
///////////////////// preparation end ////////////////////////

async function launchBrowser(name, value) {

    let Digital_Token = null;
    let RecaptchaResponse = null;
    let Cookie = null;
    let newResponse = null;
    let BasicPayload = null;
    let NewPayload = "";
    let carName = "";
    let carDesc = "";
    let payLaterAmount = "";
    let payLaterTotalAmount = "";
    let csvRow = [];
    const writeData = [];

    const browser = await puppeteer.launch({
        headless: false, // Use the new Headless mode
        // ... other options
    });

    // Rest of your code using the browser instance
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    // Listen for the request event

    page.on('request', async (request) => {

        if (!request.isNavigationRequest()) {

            // It's an AJAX request
            if (request.url().includes('https://www.avis.com/webapi/reservation/vehicles')) {
                // console.log("request >>> ", request.headers())
                
                BasicPayload = request.postData();
                // console.log("Payload >>> ", BasicPayload);
                
                if(BasicPayload) {
                    Digital_Token = request.headers()['digital-token'];
                    // console.log("Digital Token >>> ", Digital_Token);
                    Cookie = request.headers().cookie;
                    // console.log("Cookie >>> ", Cookie);
                    RecaptchaResponse = request.headers()['g-recaptcha-response'];
                    // console.log("Recaptcha Response >>> ", RecaptchaResponse);

                    const payloadElements = BasicPayload.split(",");
                    for (index in payloadElements) {
                        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>> ", payloadElements[index]);
                        if(payloadElements[index].indexOf("pickInfo") > 0) {
                            payloadElements[index] = '"pickInfo":"'+ searchKey +'"';
                            // console.log(">>>>>>>>>>>>>pickInfo>>>>>>>>>>>>>>>>> ", payloadElements[index]);
                        };
                        if(payloadElements[index].indexOf("pickDate") > 0) {
                            payloadElements[index] = '"pickDate":"'+ start_date +'"';
                            console.log(">>>>>>>>>>>>>>start date>>>>>>>>>>>>>>>> ", start_date);
                        };
                        if(payloadElements[index].indexOf("dropDate") > 0) {
                            payloadElements[index] = '"dropDate":"'+ end_date +'"';
                            // console.log(">>>>>>>>>>>>>>>end date>>>>>>>>>>>>>>> ", payloadElements[index]);
                        };
                        NewPayload = NewPayload + payloadElements[index];
                    }
                    
                }
            }
        }
        request.continue();
    });
    
    // Navigate to a page that triggers AJAX requests
    await page.goto('https://www.avis.com', {
        timeout: 300000
    });

    // Delay function
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
    // Delay for 10 seconds
    // await delay(3000); // 10,000 milliseconds = 10 seconds
    // console.log('step 1')
    // /html/body/div[4]/section/div[2]/div[1]/span
    let modalXPath = '/html/body/div[4]/section/div[2]/div[1]/span';
    try {
        const [modalClose] = await page.$x(modalXPath);
        await modalClose.click({timeout:300000});
    } catch (error) {
        console.log(error);
    }
    
    // Delay for 10 seconds
    // await delay(3000); // 10,000 milliseconds = 10 seconds
    
    let secModalXPath = '/html/body/div[4]/section/div[1]/div[1]/span';
    try {
        const [secModalClose] = await page.$x(secModalXPath);
        await secModalClose.click({timeout:300000});
    } catch (error) {
        console.log(error);
    }
    
    await page.waitForSelector('#PicLoc_value', {timeout: 300000});
    await page.type('#PicLoc_value', 'shr');
    await page.$eval('#from', (element) => {
        element.value = "10/15/2023";
    });
    
    // Delay for 10 seconds
    await delay(3000); // 10,000 milliseconds = 10 seconds
    const endDateField = await page.waitForSelector('#to', {timeout: 300000});
    // console.log('step 2', endDateField)
    await endDateField.click({timeout: 300000});
    
    // Delay for 10 seconds
    await delay(3000); // 10,000 milliseconds = 10 seconds
    const endDateXPath = '//*[@id="ui-datepicker-div"]/div[3]/table/tbody/tr[1]/td[4]/a';
    const [end_day] = await page.$x(endDateXPath);
    await end_day.click({timeout: 300000});
    
    // Delay for 10 seconds
    await delay(3000); // 10,000 milliseconds = 10 seconds
    
    const findButton = await page.waitForSelector('#res-home-select-car', {timeout: 300000});
    await findButton.click({timeout: 300000});
    // console.log(">>> submit button clicked successfully !!!");
    
    // Perform actions that trigger AJAX requests
    
    // Delay for 10 seconds
    await delay(3000); // 10,000 milliseconds = 10 seconds
    
    // console.log(">>> digital token >>> ", Digital_Token);
    // console.log(">>> recaptcha response >>> ", RecaptchaResponse);
    // console.log(">>> cookie >>> ", Cookie);
    // console.log(">>> NewPayload >>> ", NewPayload);
    fetch("https://www.avis.com/webapi/reservation/vehicles", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          "action": "RES_VEHICLESHOP",
          "bookingtype": "car",
          "channel": "Digital",
          "content-type": "application/json",
          "devicetype": "bigbrowser",
          "digital-token": Digital_Token,
          "domain": "us",
          "g-recaptcha-response": RecaptchaResponse,
          "initreservation": "true",
          "locale": "en",
          "password": "AVISCOM",
          "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "username": "AVISCOM",
          "cookie": Cookie,
          "Referer": "https://www.avis.com/en/home",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "{\"rqHeader\":{\"brand\":\"\",\"locale\":\"en_US\"},\"nonUSShop\":false,\"pickInfo\":\"SHR\",\"pickCountry\":\"US\",\"pickDate\":\"10/17/2023\",\"pickTime\":\"12:00 PM\",\"dropInfo\":\"SHR\",\"dropDate\":\"10/18/2023\",\"dropTime\":\"12:00 PM\",\"couponNumber\":\"\",\"couponInstances\":\"\",\"couponRateCode\":\"\",\"discountNumber\":\"\",\"rateType\":\"\",\"residency\":\"US\",\"age\":25,\"wizardNumber\":\"\",\"lastName\":\"\",\"userSelectedCurrency\":\"\",\"selDiscountNum\":\"\",\"promotionalCoupon\":\"\",\"preferredCarClass\":\"\",\"membershipId\":\"\",\"noMembershipAvailable\":false,\"corporateBookingType\":\"\",\"enableStrikethrough\":\"true\",\"picLocTruckIndicator\":false,\"amazonGCPayLaterPercentageVal\":\"\",\"amazonGCPayNowPercentageVal\":\"\",\"corporateEmailID\":\"\"}",
        "method": "POST"
    })
    .then(response => {
        if (response.ok) {
        return response.json(); // assuming the response is in JSON format
        } else {
        throw new Error("Request failed with status " + response.status);
        }
    })
    .then(data => {
        // handle the response data here
        // console.log(data.vehicleSummaryList);
        const infos = data.vehicleSummaryList;
        for (let num = 0; num < infos.length; num++) {
            const info = infos[num];
            if (info.payLaterRate) {
                // console.log("info>>> ", info);
                carName = info.make;
                // console.log("Name >>> ", carName);
                carDesc = info.makeModel;
                // console.log("Type >>> ", carDesc);
                // const payLater = info.payLaterRate.amount;
                // console.log("payLater >>> ", payLater);
                payLaterAmount = info.payLaterRate.amount;
                // console.log("payLaterAmount >>> ", payLaterAmount);
                payLaterTotalAmount = info.payLaterRate.totalRateAmount;
                csvRow[num] = {'Number': num, 'Name': carName, 'Type': carDesc, 'PayLater': payLaterAmount, 'PayLaterTotal': payLaterTotalAmount}
                // console.log("csvRow[", num, "] = ", csvRow[num]);
                writeData.push(csvRow[num]);
                
                // Write data to CSV file
                csvWriter
                    .writeRecords(writeData)
                    .then(() => console.log('CSV file written successfully.'))
                    .catch((err) => console.error('Error writing CSV file:', err));
            }
            
        }
    })
    .catch(error => {
        // handle any errors that occurred during the request
        console.error(error);
    });

    // //----------------------------------------------------------
    // const createCsvWriter = require('csv-writer').createObjectCsvWriter;

    // // Sample data
    // const FirstNames = ['John', 'Jane', 'Bob'];
    // const LastNames = ['Doe', 'Smith', 'Johnson'];
    // const Boxs = ['Box 1', 'Box 2', 'Box 3'];
    // const Address_lines = ['Address 1', 'Address 2', 'Address 3'];
    // const KY_Numbers = ['KY 123', 'KY 456', 'KY 789'];
    // const Islands = ['Island 1', 'Island 2', 'Island 3'];
    // const Element_Phones = ['1234567890', '9876543210', '5678901234'];

    // // Create CSV Writer
    // const csvWriter = createCsvWriter({
    // path: 'Result.csv',
    // header: [
    //     { id: 'First Name', title: 'First Name' },
    //     { id: 'Last Name', title: 'Last Name' },
    //     { id: 'BOX #', title: 'BOX #' },
    //     { id: 'Address line 1', title: 'Address line 1' },
    //     { id: 'KY Number', title: 'KY Number' },
    //     { id: 'Island', title: 'Island' },
    //     { id: 'Phone +1', title: 'Phone +1' }
    // ],
    // append: true
    // });

    // // Prepare data
    // const data = [];

    // for (let i = 0; i < FirstNames.length; i++) {
    // const row = {
    //     'First Name': FirstNames[i],
    //     'Last Name': LastNames[i],
    //     'BOX #': Boxs[i],
    //     'Address line 1': Address_lines[i],
    //     'KY Number': KY_Numbers[i],
    //     'Island': Islands[i],
    //     'Phone +1': Element_Phones[i]
    // };
    // data.push(row);
    // }

    // // Write data to CSV file
    // csvWriter
    // .writeRecords(data)
    // .then(() => console.log('CSV file written successfully.'))
    // .catch((err) => console.error('Error writing CSV file:', err));
    // //--------------------------------------------------------------
      
    // await browser.close();
}

launchBrowser()
    .then(res => console.info('end---> ', res))
    .catch(err => console.error('err--->', err));
