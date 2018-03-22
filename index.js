const md = require('markdown-it')()
const nodemailer = require('nodemailer')
const grpc = require('grpc')
const PROTO_PATH = __dirname + '/mailer.proto'
const proto = grpc.load(PROTO_PATH)

const emailUser= "xyxy0202@qq.com"
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
server.bind('0.0.0.0:6666', grpc.ServerCredentials.createInsecure())
server.start()

//send email
function send(call, callback) {
    let req = call.request
    let from = req.from
    if(!from)
        from = emailUser
    let message = {
        from: from,
        to: req.to,
        subject: req.subject,
        text: req.text,
        headers: req.headers,
    }
    switch(req.alternative){
        case 'html':{
            message.html = req.html
        }
        case 'markdown':{
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
