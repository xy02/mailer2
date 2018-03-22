const grpc = require('grpc')
const PROTO_PATH = __dirname + '/mailer.proto'
const proto = grpc.load(PROTO_PATH)

let client = new proto.mailer.Mailer('localhost:12345',grpc.credentials.createInsecure())
client.send({
    subject:'Hello xy02',
    from:'195281539@qq.com',
    to:'xyxy0202@qq.com',
    text:"aaa....",
    markdown:`### Hey man!`,
}, function(err, response) {    
    console.log(err, response);
});