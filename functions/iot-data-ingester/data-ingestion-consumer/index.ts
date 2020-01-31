import uuid from "uuid";

export const handler = (event: any) => {
    console.log('Kinesis record', event);
    console.log(uuid())
    // event.Records.forEach((record) => {
    //     // Kinesis data is base64 encoded so decode here
    //     var payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
    //     console.log('Kinesis record', record);
    //     console.log('Decoded payload:', payload);
    // });
};