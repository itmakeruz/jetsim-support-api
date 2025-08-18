import OpenAI from 'openai';
import { sleep } from 'openai/core';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { StatusTypes } from 'src/dto/types';
import { error, proccess, success } from 'src/dictonary';

const openai = new OpenAI();

const assistant_id = dotenv.config().parsed.OPENAI_ASSISTANT_ID;

export async function createChat(message: string) {
  console.log('creaete chat', message);

  try {
    let threads = await openai.beta.threads.create(
      {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      },
      {
        headers: {
          'accept-language': 'uz',
        },
      },
    );

    openai.beta.threads;

    console.log('threads id', threads.id);
    let run = await openai.beta.threads.runs.create(threads.id, { assistant_id });

    console.log('run id', run.id);

    while (['in_progress', 'queued'].includes(run.status)) {
      run = await openai.beta.threads.runs.retrieve(threads.id, run.id);
      console.log('Run status', run.status);
      await sleep(1000);
    }

    if (run.status != 'completed') return "So'rov bajarilmadi ilitmos qayta urinib ko'ring";

    let response = await openai.beta.threads.messages.list(threads.id);
    let responsemessage = response.data[0].content[0].type == 'text' ? response.data[0].content[0].text.value : '';
    let resultmessage = '';
    if (response.data[0].content[0].type == 'text' && response.data[0].content[0].text.annotations.length > 0) {
      for (const element of response.data[0].content[0].text.annotations) {
        resultmessage = removeTextBetweenIndices(responsemessage, element.start_index, element.end_index);
        responsemessage = resultmessage;
      }
    } else {
      resultmessage = responsemessage;
    }

    // console.log("Response", response.data[0].content[0].type == "text" ? response.data[0].content[0].text.annotations : '');
    return resultmessage;
  } catch (error) {
    console.log(error);
    return null;
  }
  // let chat = await openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages: [
  //         {
  //             "role": "user",
  //             "content": "Kredit olmoqchiman"
  //         }
  //     ]
  // })
  // console.log(chat.choices[0].message);
}

export async function createMessage(threadId: string, message: string, user_uuid: string) {
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });

  let run = await openai.beta.threads.runs.create(threadId, { assistant_id });

  while (['in_progress', 'queued'].includes(run.status)) {
    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log('Run status', run.status);
    await sleep(1000);
  }
  console.log(JSON.stringify(run));

  // if(run.status != 'completed') return 'So\'rov bajarilmadi ilitmos qayta urinib ko\'ring'
  if (run.status == 'requires_action') {
    let parameters = {};
    let toolId = run.required_action.submit_tool_outputs.tool_calls[0].id;
    let funcname = run.required_action.submit_tool_outputs.tool_calls[0].function.name;
    let argument = run.required_action.submit_tool_outputs.tool_calls[0].function.arguments;
    if (funcname == 'check_transaction_or_payment_status') {
      let card_number = JSON.parse(argument)?.card_number ?? undefined;
      let transaction_id = JSON.parse(argument)?.transaction_id ?? undefined;
      // parameters = await getTransaction(user_uuid, transaction_id, card_number)
    } else if (funcname == 'get_course') {
      parameters = await getCource();
    }

    return await toolOutputs(threadId, run.id, toolId, parameters);
  }

  let response = await openai.beta.threads.messages.list(threadId, { run_id: run.id });

  let responsemessage = response.data[0].content[0].type == 'text' ? response.data[0].content[0].text.value : '';
  let resultmessage = '';
  if (response.data[0].content[0].type == 'text' && response.data[0].content[0].text.annotations.length > 0) {
    for (const element of response.data[0].content[0].text.annotations) {
      resultmessage = removeTextBetweenIndices(responsemessage, element.start_index, element.end_index);
      responsemessage = resultmessage;
    }
  } else {
    resultmessage = responsemessage;
  }

  return resultmessage;
}

export async function creteThreads() {
  try {
    return await openai.beta.threads.create();
  } catch (error) {
    return null;
  }
}

async function getCource() {
  let parameters = {
    currency: '11665',
    unit: 'TRY',
    owner: 'Odilov',
  };
  return parameters;
}

// async function getTransaction(user_uuid: string, tran_id?: number, card_number?: string) {
//     let user = await prisma.users.findFirst({ where: { uuid: user_uuid }, select: { id: true }})
//     let transaction = await prisma.kassa.findMany({
//         where: {
//             id: tran_id ? tran_id : undefined,
//             card_number: card_number,
//             user_id: user.id,
//             create_status: 'accept'
//         },
//         take: 50,
//         orderBy: { id: 'desc' }
//     })
//     let result = []
//     for (const tran of transaction) {
//         let partner = await prisma.partners.findUnique({where: {id: tran.partner_id}})
//         let statuses = {
//             success: success,
//             wait: proccess,
//             get: proccess,
//             create: proccess,
//             error: error,
//         }
//         let obj = {
//             status: statuses[tran.send_status],
//             service: partner.partner_display_name,
//             [Object(tran.for_check_data)?.partnerNumberTitle?.en?.replaceAll(' ', '_')?.toLowerCase() || 'partner_name']: tran.partner_number,
//             sender_card: tran.sender_account,
//             amount: Number(tran.amount/100).toLocaleString('ru') + (tran.transaction_type == 'visa' ? " USD":" UZS"),
//             transaction_date: tran.createdAt.toLocaleString('ru')
//         }
//         result.push(obj)
//     }
//     console.log(result);

//     return result
// }

function removeTextBetweenIndices(text, startIndex, endIndex) {
  // Parametrlarni tekshirish
  if (typeof text !== 'string' || typeof startIndex !== 'number' || typeof endIndex !== 'number') {
    throw new Error("Matn va indekslar to'g'ri kiritilishi kerak.");
  }

  // Indekslarni tekshirish
  if (startIndex < 0 || endIndex > text.length || startIndex > endIndex) {
    throw new Error("Indekslar to'g'ri oraliqda bo'lishi kerak.");
  }

  // Matnning berilgan indekslar orasidagi qismini olib tashlash
  const beforeText = text.slice(0, startIndex);
  const afterText = text.slice(endIndex);

  // Qayta shakllantirilgan matnni qaytarish
  return beforeText + afterText;
}

async function toolOutputs(threadId: string, runId: string, tool_call_id: string, parameters: object) {
  const stream = await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
    tool_outputs: [
      {
        output: JSON.stringify(parameters),
        tool_call_id: tool_call_id,
      },
    ],
  });

  console.log(JSON.stringify(stream));
  let status = stream.status;
  while (['in_progress', 'queued'].includes(status)) {
    let run = await openai.beta.threads.runs.retrieve(threadId, stream.id);
    console.log('Run status', run.status);
    status = run.status;
    await sleep(1000);
  }

  let response = await openai.beta.threads.messages.list(threadId, { run_id: stream.id });
  console.log('response', JSON.stringify(response));

  let responsemessage = response.data[0].content[0].type == 'text' ? response.data[0].content[0].text.value : '';
  let resultmessage = responsemessage.replace(/【.*?】/, '');

  return resultmessage;
}
