(function() {
  'use strict';

  angular.module('spf.shared').

  constant('SPF_SINGAPORE_SCHOOLS', [
    {
      'iconUrl': '/assets/schools/Republic_Poly.jpg',
      'type': 'Polytechnic',
      'id': '2',
      'name': 'Republic Polytechnic'
    },
    {
      'iconUrl': '/assets/schools/Temasek_Poly.png',
      'type': 'Polytechnic',
      'id': '3',
      'name': 'Temasek Polytechnic'
    },
    {
      'iconUrl': '/assets/schools/DunmanHighSchoolCrest.png',
      'type': 'Junior College',
      'id': '5',
      'name': 'Dunman High School'
    },
    {
      'iconUrl': '/assets/schools/Pionerr_JC.jpg',
      'type': 'Junior College',
      'id': '6',
      'name': 'Pioneer Junior College'
    },
    {
      'iconUrl': '/assets/schools/NUS_HS.jpeg',
      'type': 'Junior College',
      'id': '7',
      'name': 'NUS High School'
    },
    {
      'iconUrl': '/assets/schools/Nanyang_Poly.jpg',
      'type': 'Polytechnic',
      'id': '8',
      'name': 'Nanyang Polytechnic'
    },
    {
      'iconUrl': '/assets/schools/Singapore_Poly.png',
      'type': 'Polytechnic',
      'id': '9',
      'name': 'Singapore Polytechnic'
    },
    {
      'iconUrl': '/assets/schools/Ngee-Ann-Poly.jpeg',
      'type': 'Polytechnic',
      'id': '10',
      'name': 'Ngee Ann Polytechnic'
    },
    {
      'iconUrl': '/assets/schools/HWA_Chong.png',
      'type': 'Junior College',
      'id': '13',
      'name': 'Hwa Chong Institution'
    },
    {
      'iconUrl': '/assets/schools/Anderson_Junior_College_iconUrl.jpg',
      'type': 'Junior College',
      'id': '14',
      'name': 'Anderson Junior College'
    },
    {
      'iconUrl': '/assets/schools/Anglo-Chinese_School_Independent.png',
      'type': 'Junior College',
      'id': '15',
      'name': 'Anglo Chinese School (Independent)'
    },
    {
      'iconUrl': '/assets/schools/National_JC.png',
      'type': 'Junior College',
      'id': '16',
      'name': 'National Junior College'
    },
    {
      'iconUrl': '/assets/schools/Temasek_Junior_College.jpg',
      'type': 'Junior College',
      'id': '17',
      'name': 'Temasek Junior College'
    },
    {
      'iconUrl': '/assets/schools/Raffles_Institute.png',
      'type': 'Junior College',
      'id': '18',
      'name': 'Raffles Institution'
    },
    {
      'iconUrl': '/assets/schools/Victoria_JC.png',
      'type': 'Junior College',
      'id': '19',
      'name': 'Victoria Junior College'
    },
    {
      'iconUrl': '/assets/schools/Yishun_JC.jpg',
      'type': 'Junior College',
      'id': '20',
      'name': 'Yishun Junior College'
    },
    {
      'iconUrl': '/assets/schools/Anglo-Chinese_School_JC.png',
      'type': 'Junior College',
      'id': '24',
      'name': 'Anglo-Chinese Junior College'
    },
    {
      'iconUrl': '/assets/schools/Catholic_JC_Crest.png',
      'type': 'Junior College',
      'id': '25',
      'name': 'Catholic Junior College'
    },
    {
      'iconUrl': '/assets/schools/Innova_Junior_College.png',
      'type': 'Junior College',
      'id': '26',
      'name': 'Innova Junior College'
    },
    {
      'iconUrl': '/assets/schools/Jurong_JC.png',
      'type': 'Junior College',
      'id': '27',
      'name': 'Jurong Junior College'
    },
    {
      'iconUrl': '/assets/schools/Meridian_JC_Crest.png',
      'type': 'Junior College',
      'id': '28',
      'name': 'Meridian Junior College'
    },
    {
      'iconUrl': '/assets/schools/Millennia_institute.jpg',
      'type': 'Junior College',
      'id': '29',
      'name': 'Millennia Institute'
    },
    {
      'iconUrl': '/assets/schools/Nanyang_JC.png',
      'type': 'Junior College',
      'id': '30',
      'name': 'Nanyang Junior College'
    },
    {
      'iconUrl': '/assets/schools/River_Valley_HS.png',
      'type': 'Junior College',
      'id': '31',
      'name': 'River Valley High School'
    },
    {
      'iconUrl': '/assets/schools/Serangoon_JC.jpg',
      'type': 'Junior College',
      'id': '32',
      'name': 'Serangoon Junior College'
    },
    {
      'iconUrl': '/assets/schools/Saint_Andrews.jpg',
      'type': 'Junior College',
      'id': '33',
      'name': 'Saint Andrew\'s Junior College'
    },
    {
      'iconUrl': '/assets/schools/Tampines_JC.jpg',
      'type': 'Junior College',
      'id': '34',
      'name': 'Tampines Junior College'
    },
    {
      'iconUrl': '/assets/schools/Sota.jpg',
      'type': 'Junior College',
      'id': '35',
      'name': 'School of the Arts'
    },
    {
      'iconUrl': '/assets/schools/St_Josephs.png',
      'type': 'Junior College',
      'id': '36',
      'name': 'St Joseph\'s Institution'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '101',
      'name': 'Admiralty Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '102',
      'name': 'Ahmad Ibrahim Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '103',
      'name': 'Anderson Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '104',
      'name': 'Ang Mo Kio Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '105',
      'name': 'Anglican High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '106',
      'name': 'Anglo-Chinese School (Barker Road)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '107',
      'name': 'Assumption English School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '108',
      'name': 'Assumption Pathway School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '109',
      'name': 'Balestier Hill Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '110',
      'name': 'Bartley Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '111',
      'name': 'Beatty Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '112',
      'name': 'Bedok Green Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '113',
      'name': 'Bedok North Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '114',
      'name': 'Bedok South Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '115',
      'name': 'Bedok Town Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '116',
      'name': 'Bedok View Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '117',
      'name': 'Bendemeer Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '118',
      'name': 'Bishan Park Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '119',
      'name': 'Boon Lay Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '120',
      'name': 'Bowen Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '121',
      'name': 'Broadrick Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '122',
      'name': 'Bukit Batok Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '123',
      'name': 'Bukit Merah Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '124',
      'name': 'Bukit Panjang Govt. High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '125',
      'name': 'Bukit View Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '126',
      'name': 'Canberra Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '127',
      'name': 'Catholic High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '128',
      'name': 'Cedar Girls\' Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '129',
      'name': 'Changkat Changi Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '130',
      'name': 'Chestnut Drive Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '131',
      'name': 'CHIJ Katong Convent'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '132',
      'name': 'CHIJ Secondary (Toa Payoh)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '133',
      'name': 'CHIJ St. Joseph\'s Convent'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '134',
      'name': 'CHIJ St. Nicholas Girls\' School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '135',
      'name': 'CHIJ St. Theresa\'s Convent'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '136',
      'name': 'Chong Boon Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '137',
      'name': 'Christ Church Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '138',
      'name': 'Chua Chu Kang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '139',
      'name': 'Chung Cheng High School (Main)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '140',
      'name': 'Chung Cheng High School (Yishun)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '141',
      'name': 'Church Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '142',
      'name': 'Clementi Town Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '143',
      'name': 'Clementi Woods Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '144',
      'name': 'Commonwealth Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '145',
      'name': 'Compassvale Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '146',
      'name': 'Coral Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '147',
      'name': 'Crescent Girls\' School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '148',
      'name': 'Crest Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '149',
      'name': 'Damai Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '150',
      'name': 'Deyi Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '151',
      'name': 'Dunearn Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '152',
      'name': 'Dunman Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '153',
      'name': 'East Spring Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '154',
      'name': 'East View Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '155',
      'name': 'Edgefield Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '156',
      'name': 'Evergreen Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '157',
      'name': 'Fairfield Methodist Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '158',
      'name': 'Fajar Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '159',
      'name': 'First Toa Payoh Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '160',
      'name': 'Fuchun Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '161',
      'name': 'Fuhua Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '162',
      'name': 'Gan Eng Seng School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '163',
      'name': 'Geylang Methodist School (Secondary)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '164',
      'name': 'Greendale Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '165',
      'name': 'Greenridge Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '166',
      'name': 'Greenview Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '167',
      'name': 'Guangyang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '168',
      'name': 'Hai Sing Catholic School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '169',
      'name': 'Henderson Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '170',
      'name': 'Hillgrove Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '171',
      'name': 'Holy Innocents\' High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '172',
      'name': 'Hong Kah Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '173',
      'name': 'Hougang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '174',
      'name': 'Hua Yi Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '175',
      'name': 'Hwa Chong Institution'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '176',
      'name': 'Junyuan Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '177',
      'name': 'Jurong Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '178',
      'name': 'Jurong West Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '179',
      'name': 'Jurongville Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '180',
      'name': 'Juying Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '181',
      'name': 'Kent Ridge Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '182',
      'name': 'Kranji Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '183',
      'name': 'Kuo Chuan Presbyterian Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '184',
      'name': 'Loyang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '185',
      'name': 'MacPherson Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '186',
      'name': 'Manjusri Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '187',
      'name': 'Maris Stella High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '188',
      'name': 'Marsiling Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '189',
      'name': 'Mayflower Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '190',
      'name': 'Methodist Girls\' School (Secondary)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '191',
      'name': 'Montfort Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '192',
      'name': 'Nan Chiau High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '193',
      'name': 'Nan Hua High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '194',
      'name': 'Nanyang Girls\' High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '195',
      'name': 'National Junior College'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '196',
      'name': 'Naval Base Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '197',
      'name': 'New Town Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '198',
      'name': 'Ngee Ann Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '199',
      'name': 'North View Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '200',
      'name': 'North Vista Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '201',
      'name': 'Northbrooks Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '202',
      'name': 'Northland Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '203',
      'name': 'Northlight School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '204',
      'name': 'Orchid Park Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '205',
      'name': 'Outram Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '206',
      'name': 'Pasir Ris Crest Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '207',
      'name': 'Pasir Ris Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '208',
      'name': 'Paya Lebar Methodist Girls\' School (Secondary)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '209',
      'name': 'Pei Hwa Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '210',
      'name': 'Peicai Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '211',
      'name': 'Peirce Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '212',
      'name': 'Ping Yi Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '213',
      'name': 'Pioneer Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '214',
      'name': 'Presbyterian High School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '215',
      'name': 'Punggol Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '216',
      'name': 'Queenstown Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '217',
      'name': 'Queensway Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '218',
      'name': 'Raffles Girls\' School (Secondary)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '219',
      'name': 'Raffles Institution (Secondary)'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '220',
      'name': 'Regent Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '221',
      'name': 'Riverside Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '222',
      'name': 'School of Science and Technology, Singapore'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '223',
      'name': 'Sembawang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '224',
      'name': 'Seng Kang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '225',
      'name': 'Serangoon Garden Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '226',
      'name': 'Serangoon Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '227',
      'name': 'Shuqun Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '228',
      'name': 'Si Ling Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '229',
      'name': 'Siglap Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '230',
      'name': 'Singapore Chinese Girls\' School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '231',
      'name': 'Singapore Sports School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '232',
      'name': 'Springfield Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '233',
      'name': 'St. Andrew\'s Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '234',
      'name': 'St. Anthony\'s Canossian Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '235',
      'name': 'St. Gabriel\'s Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '236',
      'name': 'St. Hilda\'s Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '237',
      'name': 'St. Margaret\'s Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '238',
      'name': 'St. Patrick\'s School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '239',
      'name': 'Swiss Cottage Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '240',
      'name': 'Tampines Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '241',
      'name': 'Tanglin Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '242',
      'name': 'Tanjong Katong Girls\' School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '243',
      'name': 'Tanjong Katong Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '244',
      'name': 'Teck Whye Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '245',
      'name': 'Temasek Academy'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '246',
      'name': 'Temasek Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '247',
      'name': 'Unity Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '248',
      'name': 'Victoria School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '249',
      'name': 'West Spring Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '250',
      'name': 'Westwood Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '251',
      'name': 'Whitley Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '252',
      'name': 'Woodgrove Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '253',
      'name': 'Woodlands Ring Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '254',
      'name': 'Woodlands Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '255',
      'name': 'Xinmin Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '256',
      'name': 'Yio Chu Kang Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '257',
      'name': 'Yishun Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '258',
      'name': 'Yishun Town Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '259',
      'name': 'Yuan Ching Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '260',
      'name': 'Yuhua Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '261',
      'name': 'Yusof Ishak Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '262',
      'name': 'Yuying Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '263',
      'name': 'Zhenghua Secondary School'
    },
    {
      'iconUrl': '/assets/schools/tempbadge.png',
      'type': 'Secondary',
      'id': '264',
      'name': 'Zhonghua Secondary School'
    }
  ])

  ;

})();
