import puppeteer from 'puppeteer'
import dotenv from 'dotenv'
import { CronJob } from 'cron'
import moment from 'moment'
import express from 'express'
import nodemailer from 'nodemailer'
dotenv.config()



const app = express()
const PORT = process.env.PORT || 3000

/*
    '10 * * * * *' 
    to test every ten seconds
*/
/*
    run M-F @ 9am
    '00 00 09 * * 1-5'
*/


const job = new CronJob('10 * * * * *', function() {
	//  run M-F @ 9am
	;(async () => {
		const SELECTOR = process.env.SELECTOR
		const browser = await puppeteer.launch()
		const page = await browser.newPage()
		await page.goto(process.env.URL)
		await page.waitForSelector(SELECTOR)

		const jobs = await page.evaluate(selector => {
			const jobNodeList = document.querySelectorAll(selector)
			const jobArr = []
			jobNodeList.forEach(job => jobArr.push(job.textContent))

			return jobArr
		}, SELECTOR)

        const result = jobs
        .toString()
        .replace(/Indianapolis,|Chicago,|Chicago|Indianapolis/g, function(x) {
            return ' ' + x + '\n'
        })
		sendEmail(result)
		await browser.close()
	})()

	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // use SSL
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD
		}
	});
	
	const options = {
		to: process.env.RECIPIENT,
		subject: ` ${moment().format('MMM Do YY')} - ${process.env.EMAIL_SUBJECT}`,
		text: null,	
	}
	
	const sendEmail = text =>{
		const message = {
			text,
		}
		const mailOptions = Object.assign(options, message)
		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				console.log(error)
			} else {
				console.log('Email sent: ' + info.response)
			}
		})
	}	
})


job.start()
