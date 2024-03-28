import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Init1705486461952 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          {
            name: 'id',
            type: 'int',
            isNullable: false,
            generationStrategy: 'increment',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'vk_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'firstname',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'lastname',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'dob',
            type: 'varchar',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'sex',
            type: 'varchar',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'communication',
            type: 'varchar',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'age',
            type: 'smallint',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'date_created',
            type: 'timestamp without time zone',
            isNullable: true,
            isUnique: false,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'game',
        columns: [
          {
            name: 'id',
            type: 'int',
            isNullable: false,
            generationStrategy: 'increment',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'affiche',
        columns: [
          {
            name: 'id',
            type: 'int',
            isNullable: false,
            generationStrategy: 'increment',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'dog',
            type: 'timestamp',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'id_game',
            type: 'int',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk-affiche_game-id_game-game',
            columnNames: ['id_game'],
            referencedColumnNames: ['id'],
            referencedTableName: 'game',
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_request',
        columns: [
          {
            name: 'id',
            type: 'int',
            isNullable: false,
            generationStrategy: 'increment',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'date_deleted',
            type: 'timestamp without time zone',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'date_created',
            type: 'timestamp without time zone',
            isNullable: true,
            isUnique: false,
          },
          {
            name: 'user_comment',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'admin_comment',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'id_user',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'id_affiche',
            type: 'int',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk-user_request_affiche-id_affiche-affiche',
            columnNames: ['id_affiche'],
            referencedColumnNames: ['id'],
            referencedTableName: 'affiche',
            onDelete: 'CASCADE',
          },
          {
            name: 'fk-user_request_user-id_user-user',
            columnNames: ['id_user'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.query(
      "INSERT INTO game (name, description) VALUES ('Shadowrun', 'Перед вами мрачный мир будущего, где технологии и гнетущая атмосфера перемешаны с фэнтезийными расами, магией и даже эзотерикой. Настольная ролевая система получила новый приток игроков и популярности благодаря серии видеоигр по мотивам предыдущих редакций игры. Вы же окажетесь в шестой редакции правил Shadowrun и будете участвовать в тактических сражениях, творить магию и, конечно же, взламывать компьютерные сети. Для погружения во вселенную игроки придумывают персонажей-бегущих – наёмников, готовых выполнять любые задания, в том числе и не совсем легальные, от мегакорпораций и мафии до религиозных культов и тайных обществ.')",
    );
    await queryRunner.query(
      "INSERT INTO game (name, description) VALUES ('Pathfinder', 'Голарион, мир Pathfinder – это яркая и многогранная фэнтезийная вселенная, в которой органично сплетаются совершенно разные культурные и исторические мотивы. Вы можете отправиться в пустынные земли изучать гробницы древних царей, сражаться с нежитью в джунглях, кишащих опасными тварями или присоединиться к вольному пиратскому братству и отправиться потрошить трюмы купеческих кораблей. Всё это самым неожиданным образом может сочетаться с выбранными вами классом и происхождением героя. Выбирайте, кем стать в новом мире – талантливым бардом, могучим магом огня или фанатичным поборником добра и справедливости, упорным и сильным дварфом, изящным эльфом или хитрым гоблином – у каждого класса и народа есть свои особенности и пути развития, которые и создадут вашего уникального героя.')",
    );
    await queryRunner.query(
      "INSERT INTO game (name, description) VALUES ('Ведьмак', 'Страны Континента погрязли в бесконечных войнах и усобицах, а некогда мирные граждане превратились  в сброд мародёров, убийц и насильников. В глухих деревнях и чащобах чудовища осмелели настолько, что выйти в дорогу безоружным или в одиночку стало равносильно подписанию приговора самому себе. И лишь богомерзкие мутанты, ведьмаки, занимаются истреблением охочих до человеческой плоти монстров. Человечество истребило или вытеснило в глушь почти все остальные расы, а их древние города разрушены и преданы забвению. Погрузитесь в этот мир, мрачный настолько, что редкие искры дружбы, товарищества и любви кажутся ярче солнца. Так берегите же их!')",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_request');
    await queryRunner.dropTable('user');
    await queryRunner.dropTable('affiche');
    await queryRunner.dropTable('game');
  }
}
