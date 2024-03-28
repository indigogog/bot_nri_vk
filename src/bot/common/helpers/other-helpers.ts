import { UserRequestEntity } from '../../../main-entities/user-request/user-request.entity';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as ExelJs from 'exceljs';
import { rm } from 'fs';

interface fileMap {
  dateCreated: string;
  id: number;
  adminComment: string;
  vkId: number;
  firstname: string;
  lastname: string;
  dob: string;
  sex: string;
  communication: string;
  game: string;
  status: string;
  date: string;
  age: string;
  user: string;
  link: string;
  userComment: string;
}

export const myRemoveFile = (filePath: string[]) => {
  try {
    if (Array.isArray(filePath)) {
      for (const fileInfo of filePath) {
        rm(fileInfo, (err) => {
          if (err) {
            console.log(err.message);
          }
        });
      }
      return true;
    }

    rm(filePath, (err) => {
      if (err) {
        throw new Error(err.message);
      }
    });

    return true;
  } catch (e) {
    console.log(e.message);
  }
};

export const checkForNull = (data: any, noDataString = 'Неизвестно') => {
  if (data) return data;
  return noDataString;
};

export const makeFileReport = async (requests: UserRequestEntity[]) => {
  const mainPath = '/files/excel/';
  const filePath = mainPath + `${dayjs().format('DD-MM-YYYY:hh:mm:ss')}-requests.xlsx`;

  if (!fs.existsSync(process.cwd() + mainPath)) {
    fs.mkdirSync(process.cwd() + mainPath, { recursive: true });
  }

  const data: fileMap[] = requests.map((r) => ({
    id: r.id,
    game: r.affiche.game.name,
    date: dayjs(r.affiche.dog).isValid() ? dayjs(r.affiche.dog).format('DD-MM-YYYY:HH:mm') : '',
    dateCreated: dayjs(r.dateCreated).format('DD-MM-YYYY:HH:mm:ss'),
    status: r.dateDeleted ? 'ОТМЕНЕНА' : '',
    firstname: r.user.firstname,
    lastname: r.user.lastname,
    link: `https://vk.com/id${r.user.vkId}`,
    user: r.user.firstname + ' ' + r.user.lastname,
    communication: checkForNull(r.user.communication, ''),
    age: checkForNull(r.user.age, ''),
    sex: checkForNull(r.user.sex, ''),
    adminComment: checkForNull(r.adminComment, ''),
    userComment: checkForNull(r.userComment, ''),
    vkId: r.user.vkId,
    dob: dayjs(r.user.dob).isValid() ? dayjs(r.user.dob).format('DD-MM-YYYY') : r.user.dob ?? '',
  }));

  const workBook = new ExelJs.Workbook();

  const sheetForStyling = workBook.addWorksheet();

  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

  for (let i = 1; i < 24; i++) {
    sheetForStyling.getColumn(i).width = 20;
  }

  const alignment: Partial<ExelJs.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };

  sheetForStyling.getCell('A1').value = '№';
  sheetForStyling.getCell('B1').value = 'Игра';
  sheetForStyling.getCell('C1').value = 'Дата игры';
  sheetForStyling.getCell('D1').value = 'Дата создания заявки';
  sheetForStyling.getCell('E1').value = 'Статус';
  sheetForStyling.getCell('F1').value = 'Имя';
  sheetForStyling.getCell('G1').value = 'Фамилия';
  sheetForStyling.getCell('H1').value = 'Ссылка';
  sheetForStyling.getCell('I1').value = 'Пользователь';
  sheetForStyling.getCell('J1').value = 'Способ связи';
  sheetForStyling.getCell('K1').value = 'Возраст';
  sheetForStyling.getCell('L1').value = 'Пол';
  sheetForStyling.getCell('M1').value = 'Комментарий админа';
  sheetForStyling.getCell('N1').value = 'Комментарий пользователя';
  sheetForStyling.getCell('O1').value = 'vk id';
  sheetForStyling.getCell('P1').value = 'Дата рождения';

  sheetForStyling.getCell('A1').alignment = alignment;
  sheetForStyling.getCell('B1').alignment = alignment;
  sheetForStyling.getCell('C1').alignment = alignment;
  sheetForStyling.getCell('D1').alignment = alignment;
  sheetForStyling.getCell('E1').alignment = alignment;
  sheetForStyling.getCell('F1').alignment = alignment;
  sheetForStyling.getCell('G1').alignment = alignment;
  sheetForStyling.getCell('H1').alignment = alignment;
  sheetForStyling.getCell('I1').alignment = alignment;
  sheetForStyling.getCell('J1').alignment = alignment;
  sheetForStyling.getCell('K1').alignment = alignment;
  sheetForStyling.getCell('L1').alignment = alignment;
  sheetForStyling.getCell('M1').alignment = alignment;
  sheetForStyling.getCell('N1').alignment = alignment;
  sheetForStyling.getCell('O1').alignment = alignment;
  sheetForStyling.getCell('P1').alignment = alignment;

  data.map((raw, i) => {
    Object.values(raw).map((cell, j) => {
      sheetForStyling.getCell(`${columns[j]}${i + 2}`).value = cell;
      sheetForStyling.getCell(`${columns[j]}${i + 2}`).alignment = alignment;
    });
  });

  await workBook.xlsx.writeFile(process.cwd() + filePath);

  setTimeout(() => myRemoveFile([process.cwd() + filePath]), 120000);

  let size;
  fs.stat(process.cwd() + filePath, (err, stats) => {
    if (err) {
      throw err;
    }
    size = stats.size;
  });

  return { path: process.cwd() + filePath, size };
};
