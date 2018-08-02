const md = require('markdown-it')()
const nodemailer = require('nodemailer')
const grpc = require('grpc')
const fs = require('fs')
const path = require("path")
const PROTO_PATH = path.join(__dirname, 'mailer.proto')
// const PROTO_PATH = __dirname + '/mailer.proto'
const proto = grpc.load(PROTO_PATH)

const config = require('./config')

const emailUser = config.SMTP.auth.user
// create reusable transporter object using the default SMTP transport
// const transporter = nodemailer.createTransport({
//     host: 'smtp.qq.com',
//     secure: true, // true for 465, false for other ports
//     auth: {
//         user: emailUser,
//         pass: "clifqvoarmlibhah",
//     }
// })
const transporter = nodemailer.createTransport(config.SMTP)

let server = new grpc.Server()
server.addService(proto.mailer.Mailer.service, {
    send: send,
    sendWithAttachment: sendWithAttachment,
})
server.bind(config.serverAddress, grpc.ServerCredentials.createSsl(null, [
    {
        private_key: fs.readFileSync(path.join(__dirname,config.pritvateKey)),
        cert_chain: fs.readFileSync(path.join(__dirname,config.cert)),
    },
]))
server.start()
console.log(new Date(), "--------Start Mailer2--------")

//ip:lasttime
let ipMap = {}

setInterval(()=>{
    for(let i in ipMap){
        let lasttime = ipMap[i]
        let now = Date.now()
        if(lasttime && now - lasttime > config.ipLimitSecond*1000 ){
            delete ipMap[i]
        }
    }
}, config.ipLimitSecond * 30 * 1000)

//send email
function send(call, callback) {
    let req = call.request
    //check ip
    let ip = req.user_ip
    console.log(req.user_ip, req.userIp)
    if (ip){
        let lasttime = ipMap[ip]
        let now = Date.now()
        if(lasttime && now - lasttime < config.ipLimitSecond*1000 ){
            return callback(new Error("too fast"))
        }
        ipMap[ip] = now
    }

    let from = req.from
    if (!from)
        from = emailUser
    let message = {
        from: from,
        to: req.to,
        subject: req.subject,
        text: req.text,
        headers: req.headers,
    }
    switch (req.alternative) {
        case 'html': {
            message.html = req.html
        }
        case 'markdown': {
            message.html = md.render(req.markdown)
        }
    }
    // send mail with defined transport object
    transporter.sendMail(message, (error, info) => {
        if (error) {
            return callback(new Error(error.message))
        }
        // Preview only available when sending through an Ethereal account
        console.log(info)
        callback(null, {})
    })
}

function sendWithAttachment(call, callback) {

}
