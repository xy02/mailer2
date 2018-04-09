const md = require('markdown-it')()
const nodemailer = require('nodemailer')
const grpc = require('grpc')
const fs = require('fs')
const path = require("path")
const PROTO_PATH = path.join(__dirname, 'mailer.proto')
// const PROTO_PATH = __dirname + '/mailer.proto'
const proto = grpc.load(PROTO_PATH)

const emailUser = "xyxy0202@qq.com"
// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secure: true, // true for 465, false for other ports
    auth: {
        user: emailUser,
        pass: "clifqvoarmlibhah",
    }
})

let server = new grpc.Server()
server.addService(proto.mailer.Mailer.service, {
    send: send,
    sendWithAttachment: sendWithAttachment,
})
server.bind('0.0.0.0:6666', grpc.ServerCredentials.createSsl(null, [
    {
        private_key: fs.readFileSync(path.join(__dirname,"xy_pri_key.pem")),
        cert_chain: fs.readFileSync(path.join(__dirname,"xy_ca.crt")),
    },
]))
server.start()
console.log(new Date(), "--------Start Mailer2--------")

//send email
function send(call, callback) {
    let req = call.request
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
