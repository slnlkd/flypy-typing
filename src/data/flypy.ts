// 小鹤双拼键位映射数据
// 参考：https://flypy.cc/

// ============================================================
// 键位图数据
// ============================================================

export interface KeyInfo {
  key: string;
  initial: string;   // 声母（红色显示）
  finals: string[];   // 韵母列表（蓝色显示）
}

// 口诀：秋闱 软月 云梳翅 松拥 黛粉 更航安 快莺 两望 奏 夏蛙 撇 草 追鱼 滨鸟眠
export const keyboardLayout: KeyInfo[][] = [
  // 第一行 QWERTYUIOP
  [
    { key: 'Q', initial: 'q', finals: ['iu'] },
    { key: 'W', initial: 'w', finals: ['ei'] },
    { key: 'E', initial: '', finals: ['e'] },
    { key: 'R', initial: 'r', finals: ['uan', 'er'] },
    { key: 'T', initial: 't', finals: ['ue', 've'] },
    { key: 'Y', initial: 'y', finals: ['un'] },
    { key: 'U', initial: 'sh', finals: ['u'] },
    { key: 'I', initial: 'ch', finals: ['i'] },
    { key: 'O', initial: '', finals: ['uo', 'o'] },
    { key: 'P', initial: 'p', finals: ['ie'] },
  ],
  // 第二行 ASDFGHJKL
  [
    { key: 'A', initial: '', finals: ['a'] },
    { key: 'S', initial: 's', finals: ['ong', 'iong'] },
    { key: 'D', initial: 'd', finals: ['ai', 'uai'] },
    { key: 'F', initial: 'f', finals: ['en'] },
    { key: 'G', initial: 'g', finals: ['eng'] },
    { key: 'H', initial: 'h', finals: ['ang'] },
    { key: 'J', initial: 'j', finals: ['an'] },
    { key: 'K', initial: 'k', finals: ['ing'] },
    { key: 'L', initial: 'l', finals: ['iang', 'uang'] },
  ],
  // 第三行 ZXCVBNM
  [
    { key: 'Z', initial: 'z', finals: ['ou'] },
    { key: 'X', initial: 'x', finals: ['ia', 'ua'] },
    { key: 'C', initial: 'c', finals: ['ao'] },
    { key: 'V', initial: 'zh', finals: ['ui', 'v'] },
    { key: 'B', initial: 'b', finals: ['in'] },
    { key: 'N', initial: 'n', finals: ['iao'] },
    { key: 'M', initial: 'm', finals: ['ian'] },
  ],
];

// ============================================================
// 小鹤双拼完整映射：全拼 -> 双拼编码
// ============================================================
// 声母键：zh->v, ch->i, sh->u, 其余不变
// 韵母键：Q=iu W=ei R=uan/er T=ue/ve Y=un O=uo/o P=ie
//         A=a S=ong/iong D=ai/uai F=en G=eng H=ang J=an K=ing L=iang/uang
//         Z=ou X=ia/ua C=ao V=ui/v B=in N=iao M=ian
// 零声母：单字母韵母=重复(aa/oo/ee)，双字母=原样(ai/an/ao)，三字母=首字母+韵母键(ah/eg)

export const pinyinToFlypy: Record<string, string> = {
  // ---- 零声母 ----
  a: 'aa', ai: 'ai', an: 'an', ang: 'ah', ao: 'ao',
  e: 'ee', ei: 'ei', en: 'en', eng: 'eg', er: 'er',
  o: 'oo', ou: 'ou',

  // ---- b ----
  ba: 'ba', bai: 'bd', ban: 'bj', bang: 'bh', bao: 'bc',
  bei: 'bw', ben: 'bf', beng: 'bg', bi: 'bi', bian: 'bm',
  biao: 'bn', bie: 'bp', bin: 'bb', bing: 'bk', bo: 'bo', bu: 'bu',

  // ---- p ----
  pa: 'pa', pai: 'pd', pan: 'pj', pang: 'ph', pao: 'pc',
  pei: 'pw', pen: 'pf', peng: 'pg', pi: 'pi', pian: 'pm',
  piao: 'pn', pie: 'pp', pin: 'pb', ping: 'pk', po: 'po',
  pou: 'pz', pu: 'pu',

  // ---- m ----
  ma: 'ma', mai: 'md', man: 'mj', mang: 'mh', mao: 'mc',
  me: 'me', mei: 'mw', men: 'mf', meng: 'mg', mi: 'mi',
  mian: 'mm', miao: 'mn', mie: 'mp', min: 'mb', ming: 'mk',
  miu: 'mq', mo: 'mo', mou: 'mz', mu: 'mu',

  // ---- f ----
  fa: 'fa', fan: 'fj', fang: 'fh', fei: 'fw', fen: 'ff',
  feng: 'fg', fo: 'fo', fou: 'fz', fu: 'fu',

  // ---- d ----
  da: 'da', dai: 'dd', dan: 'dj', dang: 'dh', dao: 'dc',
  de: 'de', dei: 'dw', den: 'df', deng: 'dg', di: 'di',
  dia: 'dx', dian: 'dm', diao: 'dn', die: 'dp', ding: 'dk',
  diu: 'dq', dong: 'ds', dou: 'dz', du: 'du', duan: 'dr',
  dui: 'dv', dun: 'dy', duo: 'do',

  // ---- t ----
  ta: 'ta', tai: 'td', tan: 'tj', tang: 'th', tao: 'tc',
  te: 'te', tei: 'tw', teng: 'tg', ti: 'ti', tian: 'tm',
  tiao: 'tn', tie: 'tp', ting: 'tk', tong: 'ts', tou: 'tz',
  tu: 'tu', tuan: 'tr', tui: 'tv', tun: 'ty', tuo: 'to',

  // ---- n ----
  na: 'na', nai: 'nd', nan: 'nj', nang: 'nh', nao: 'nc',
  ne: 'ne', nei: 'nw', nen: 'nf', neng: 'ng', ni: 'ni',
  nian: 'nm', niang: 'nl', niao: 'nn', nie: 'np', nin: 'nb',
  ning: 'nk', niu: 'nq', nong: 'ns', nou: 'nz', nu: 'nu',
  nuan: 'nr', nun: 'ny', nuo: 'no', nv: 'nv', nve: 'nt', nue: 'nt',

  // ---- l ----
  la: 'la', lai: 'ld', lan: 'lj', lang: 'lh', lao: 'lc',
  le: 'le', lei: 'lw', leng: 'lg', li: 'li', lia: 'lx',
  lian: 'lm', liang: 'll', liao: 'ln', lie: 'lp', lin: 'lb',
  ling: 'lk', liu: 'lq', lo: 'lo', long: 'ls', lou: 'lz',
  lu: 'lu', luan: 'lr', lun: 'ly', luo: 'lo', lv: 'lv', lve: 'lt', lue: 'lt',

  // ---- g ----
  ga: 'ga', gai: 'gd', gan: 'gj', gang: 'gh', gao: 'gc',
  ge: 'ge', gei: 'gw', gen: 'gf', geng: 'gg', gong: 'gs',
  gou: 'gz', gu: 'gu', gua: 'gx', guai: 'gd', guan: 'gr',
  guang: 'gl', gui: 'gv', gun: 'gy', guo: 'go',

  // ---- k ----
  ka: 'ka', kai: 'kd', kan: 'kj', kang: 'kh', kao: 'kc',
  ke: 'ke', kei: 'kw', ken: 'kf', keng: 'kg', kong: 'ks',
  kou: 'kz', ku: 'ku', kua: 'kx', kuai: 'kd', kuan: 'kr',
  kuang: 'kl', kui: 'kv', kun: 'ky', kuo: 'ko',

  // ---- h ----
  ha: 'ha', hai: 'hd', han: 'hj', hang: 'hh', hao: 'hc',
  he: 'he', hei: 'hw', hen: 'hf', heng: 'hg', hong: 'hs',
  hou: 'hz', hu: 'hu', hua: 'hx', huai: 'hd', huan: 'hr',
  huang: 'hl', hui: 'hv', hun: 'hy', huo: 'ho',

  // ---- j ----
  ji: 'ji', jia: 'jx', jian: 'jm', jiang: 'jl', jiao: 'jn',
  jie: 'jp', jin: 'jb', jing: 'jk', jiong: 'js', jiu: 'jq',
  ju: 'ju', juan: 'jr', jue: 'jt', jun: 'jy',

  // ---- q ----
  qi: 'qi', qia: 'qx', qian: 'qm', qiang: 'ql', qiao: 'qn',
  qie: 'qp', qin: 'qb', qing: 'qk', qiong: 'qs', qiu: 'qq',
  qu: 'qu', quan: 'qr', que: 'qt', qun: 'qy',

  // ---- x ----
  xi: 'xi', xia: 'xx', xian: 'xm', xiang: 'xl', xiao: 'xn',
  xie: 'xp', xin: 'xb', xing: 'xk', xiong: 'xs', xiu: 'xq',
  xu: 'xu', xuan: 'xr', xue: 'xt', xun: 'xy',

  // ---- r ----
  ran: 'rj', rang: 'rh', rao: 'rc', re: 're', ren: 'rf',
  reng: 'rg', ri: 'ri', rong: 'rs', rou: 'rz', ru: 'ru',
  rua: 'rx', ruan: 'rr', rui: 'rv', run: 'ry', ruo: 'ro',

  // ---- z ----
  za: 'za', zai: 'zd', zan: 'zj', zang: 'zh', zao: 'zc',
  ze: 'ze', zei: 'zw', zen: 'zf', zeng: 'zg', zi: 'zi',
  zong: 'zs', zou: 'zz', zu: 'zu', zuan: 'zr', zui: 'zv',
  zun: 'zy', zuo: 'zo',

  // ---- c ----
  ca: 'ca', cai: 'cd', can: 'cj', cang: 'ch', cao: 'cc',
  ce: 'ce', cen: 'cf', ceng: 'cg', ci: 'ci', cong: 'cs',
  cou: 'cz', cu: 'cu', cuan: 'cr', cui: 'cv', cun: 'cy', cuo: 'co',

  // ---- s ----
  sa: 'sa', sai: 'sd', san: 'sj', sang: 'sh', sao: 'sc',
  se: 'se', sen: 'sf', seng: 'sg', si: 'si', song: 'ss',
  sou: 'sz', su: 'su', suan: 'sr', sui: 'sv', sun: 'sy', suo: 'so',

  // ---- zh (v) ----
  zha: 'va', zhai: 'vd', zhan: 'vj', zhang: 'vh', zhao: 'vc',
  zhe: 've', zhei: 'vw', zhen: 'vf', zheng: 'vg', zhi: 'vi',
  zhong: 'vs', zhou: 'vz', zhu: 'vu', zhua: 'vx', zhuai: 'vd',
  zhuan: 'vr', zhuang: 'vl', zhui: 'vv', zhun: 'vy', zhuo: 'vo',

  // ---- ch (i) ----
  cha: 'ia', chai: 'id', chan: 'ij', chang: 'ih', chao: 'ic',
  che: 'ie', chen: 'if', cheng: 'ig', chi: 'ii', chong: 'is',
  chou: 'iz', chu: 'iu', chuai: 'id', chuan: 'ir', chuang: 'il',
  chui: 'iv', chun: 'iy', chuo: 'io',

  // ---- sh (u) ----
  sha: 'ua', shai: 'ud', shan: 'uj', shang: 'uh', shao: 'uc',
  she: 'ue', shei: 'uw', shen: 'uf', sheng: 'ug', shi: 'ui',
  shou: 'uz', shu: 'uu', shua: 'ux', shuai: 'ud', shuan: 'ur',
  shuang: 'ul', shui: 'uv', shun: 'uy', shuo: 'uo',

  // ---- y ----
  ya: 'ya', yan: 'yj', yang: 'yh', yao: 'yc', ye: 'ye',
  yi: 'yi', yin: 'yb', ying: 'yk', yo: 'yo', yong: 'ys',
  you: 'yz', yu: 'yu', yuan: 'yr', yue: 'yt', yun: 'yy',

  // ---- w ----
  wa: 'wa', wai: 'wd', wan: 'wj', wang: 'wh', wei: 'ww',
  wen: 'wf', weng: 'wg', wo: 'wo', wu: 'wu',
};

// 反向映射：双拼编码 -> 可能的全拼列表
export const flypyToPinyin: Record<string, string[]> = {};
for (const [pinyin, flypy] of Object.entries(pinyinToFlypy)) {
  if (!flypyToPinyin[flypy]) {
    flypyToPinyin[flypy] = [];
  }
  flypyToPinyin[flypy].push(pinyin);
}

// ============================================================
// 常用汉字练习数据
// ============================================================

export interface CharItem {
  char: string;
  pinyin: string;  // 全拼（不带声调）
}

// 预置常用字（按使用频率排序）
export const commonChars: CharItem[] = [
  { char: '的', pinyin: 'de' },
  { char: '一', pinyin: 'yi' },
  { char: '是', pinyin: 'shi' },
  { char: '不', pinyin: 'bu' },
  { char: '了', pinyin: 'le' },
  { char: '人', pinyin: 'ren' },
  { char: '我', pinyin: 'wo' },
  { char: '在', pinyin: 'zai' },
  { char: '有', pinyin: 'you' },
  { char: '他', pinyin: 'ta' },
  { char: '这', pinyin: 'zhe' },
  { char: '中', pinyin: 'zhong' },
  { char: '大', pinyin: 'da' },
  { char: '来', pinyin: 'lai' },
  { char: '上', pinyin: 'shang' },
  { char: '国', pinyin: 'guo' },
  { char: '个', pinyin: 'ge' },
  { char: '到', pinyin: 'dao' },
  { char: '说', pinyin: 'shuo' },
  { char: '们', pinyin: 'men' },
  { char: '为', pinyin: 'wei' },
  { char: '子', pinyin: 'zi' },
  { char: '和', pinyin: 'he' },
  { char: '你', pinyin: 'ni' },
  { char: '地', pinyin: 'di' },
  { char: '出', pinyin: 'chu' },
  { char: '道', pinyin: 'dao' },
  { char: '也', pinyin: 'ye' },
  { char: '时', pinyin: 'shi' },
  { char: '年', pinyin: 'nian' },
  { char: '得', pinyin: 'de' },
  { char: '就', pinyin: 'jiu' },
  { char: '那', pinyin: 'na' },
  { char: '要', pinyin: 'yao' },
  { char: '下', pinyin: 'xia' },
  { char: '以', pinyin: 'yi' },
  { char: '生', pinyin: 'sheng' },
  { char: '会', pinyin: 'hui' },
  { char: '自', pinyin: 'zi' },
  { char: '着', pinyin: 'zhe' },
  { char: '去', pinyin: 'qu' },
  { char: '之', pinyin: 'zhi' },
  { char: '过', pinyin: 'guo' },
  { char: '家', pinyin: 'jia' },
  { char: '学', pinyin: 'xue' },
  { char: '对', pinyin: 'dui' },
  { char: '可', pinyin: 'ke' },
  { char: '她', pinyin: 'ta' },
  { char: '里', pinyin: 'li' },
  { char: '后', pinyin: 'hou' },
  { char: '小', pinyin: 'xiao' },
  { char: '么', pinyin: 'me' },
  { char: '心', pinyin: 'xin' },
  { char: '多', pinyin: 'duo' },
  { char: '天', pinyin: 'tian' },
  { char: '而', pinyin: 'er' },
  { char: '能', pinyin: 'neng' },
  { char: '好', pinyin: 'hao' },
  { char: '都', pinyin: 'dou' },
  { char: '然', pinyin: 'ran' },
  { char: '没', pinyin: 'mei' },
  { char: '日', pinyin: 'ri' },
  { char: '于', pinyin: 'yu' },
  { char: '起', pinyin: 'qi' },
  { char: '还', pinyin: 'hai' },
  { char: '发', pinyin: 'fa' },
  { char: '成', pinyin: 'cheng' },
  { char: '事', pinyin: 'shi' },
  { char: '只', pinyin: 'zhi' },
  { char: '作', pinyin: 'zuo' },
  { char: '当', pinyin: 'dang' },
  { char: '想', pinyin: 'xiang' },
  { char: '看', pinyin: 'kan' },
  { char: '文', pinyin: 'wen' },
  { char: '无', pinyin: 'wu' },
  { char: '开', pinyin: 'kai' },
  { char: '手', pinyin: 'shou' },
  { char: '十', pinyin: 'shi' },
  { char: '用', pinyin: 'yong' },
  { char: '主', pinyin: 'zhu' },
  { char: '行', pinyin: 'xing' },
  { char: '方', pinyin: 'fang' },
  { char: '又', pinyin: 'you' },
  { char: '如', pinyin: 'ru' },
  { char: '前', pinyin: 'qian' },
  { char: '所', pinyin: 'suo' },
  { char: '本', pinyin: 'ben' },
  { char: '见', pinyin: 'jian' },
  { char: '经', pinyin: 'jing' },
  { char: '头', pinyin: 'tou' },
  { char: '面', pinyin: 'mian' },
  { char: '公', pinyin: 'gong' },
  { char: '同', pinyin: 'tong' },
  { char: '三', pinyin: 'san' },
  { char: '已', pinyin: 'yi' },
  { char: '老', pinyin: 'lao' },
  { char: '从', pinyin: 'cong' },
  { char: '动', pinyin: 'dong' },
  { char: '两', pinyin: 'liang' },
  { char: '长', pinyin: 'chang' },
  { char: '知', pinyin: 'zhi' },
  { char: '民', pinyin: 'min' },
  { char: '样', pinyin: 'yang' },
  { char: '现', pinyin: 'xian' },
  { char: '分', pinyin: 'fen' },
  { char: '将', pinyin: 'jiang' },
  { char: '外', pinyin: 'wai' },
  { char: '但', pinyin: 'dan' },
  { char: '身', pinyin: 'shen' },
  { char: '些', pinyin: 'xie' },
  { char: '与', pinyin: 'yu' },
  { char: '高', pinyin: 'gao' },
  { char: '意', pinyin: 'yi' },
  { char: '进', pinyin: 'jin' },
  { char: '把', pinyin: 'ba' },
  { char: '法', pinyin: 'fa' },
  { char: '此', pinyin: 'ci' },
  { char: '实', pinyin: 'shi' },
  { char: '回', pinyin: 'hui' },
  { char: '二', pinyin: 'er' },
  { char: '理', pinyin: 'li' },
  { char: '美', pinyin: 'mei' },
  { char: '点', pinyin: 'dian' },
  { char: '月', pinyin: 'yue' },
  { char: '明', pinyin: 'ming' },
  { char: '其', pinyin: 'qi' },
  { char: '种', pinyin: 'zhong' },
  { char: '声', pinyin: 'sheng' },
  { char: '全', pinyin: 'quan' },
  { char: '工', pinyin: 'gong' },
  { char: '己', pinyin: 'ji' },
  { char: '话', pinyin: 'hua' },
  { char: '儿', pinyin: 'er' },
  { char: '力', pinyin: 'li' },
  { char: '正', pinyin: 'zheng' },
  { char: '定', pinyin: 'ding' },
  { char: '名', pinyin: 'ming' },
  { char: '山', pinyin: 'shan' },
  { char: '水', pinyin: 'shui' },
  { char: '花', pinyin: 'hua' },
  { char: '风', pinyin: 'feng' },
  { char: '春', pinyin: 'chun' },
  { char: '夜', pinyin: 'ye' },
  { char: '白', pinyin: 'bai' },
  { char: '光', pinyin: 'guang' },
  { char: '海', pinyin: 'hai' },
  { char: '云', pinyin: 'yun' },
  { char: '鸟', pinyin: 'niao' },
  { char: '雨', pinyin: 'yu' },
  { char: '飞', pinyin: 'fei' },
  { char: '落', pinyin: 'luo' },
  { char: '红', pinyin: 'hong' },
  { char: '楼', pinyin: 'lou' },
  { char: '书', pinyin: 'shu' },
  { char: '笑', pinyin: 'xiao' },
  { char: '情', pinyin: 'qing' },
  { char: '思', pinyin: 'si' },
  { char: '梦', pinyin: 'meng' },
  { char: '世', pinyin: 'shi' },
  { char: '新', pinyin: 'xin' },
  { char: '万', pinyin: 'wan' },
];

// ============================================================
// 预置文章
// ============================================================

export const presetArticles = [
  {
    title: '朱自清《春》节选',
    content: '盼望着，盼望着，东风来了，春天的脚步近了。一切都像刚睡醒的样子，欣欣然张开了眼。山朗润起来了，水涨起来了，太阳的脸红起来了。小草偷偷地从土里钻出来，嫩嫩的，绿绿的。园子里，田野里，瞧去，一大片一大片满是的。坐着，躺着，打两个滚，剔几脚球，赛几趟跑，捉几回迷藏。风轻悄悄的，草软绵绵的。',
  },
  {
    title: '荷塘月色（节选）- 朱自清',
    content: '这几天心里颇不宁静。今晚在院子里坐着乘凉，忽然想起日日走过的荷塘，在这满月的光里，总该另有一番样子吧。月亮渐渐地升高了，墙外马路上孩子们的欢笑，已经听不见了；妻在屋里拍着闰儿，模糊地哼着眠歌。我悄悄地披上大衫，带上门出去。沿着荷塘，是一条曲折的小煤屑路。这是一条幽僻的路；白天也少人走，夜晚更加寂寞。荷塘四面，长着许多树，蓊蓊郁郁的。路的一旁，是些杨柳，和一些不知道名字的树。没有月光的晚上，这路上阴森森的，有些怕人。今晚却很好，虽然月光也还是淡淡的。',
  },
  {
    title: '醉翁亭记（节选）- 欧阳修',
    content: '环滁皆山也。其西南诸峰，林壑尤美，望之蔚然而深秀者，琅琊也。山行六七里，渐闻水声潺潺而泻出于两峰之间者，酿泉也。峰回路转，有亭翼然临于泉上者，醉翁亭也。作亭者谁？山之僧智仙也。名之者谁？太守自谓也。太守与客来饮于此，饮少辄醉，而年又最高，故自号曰醉翁也。醉翁之意不在酒，在乎山水之间也。山水之乐，得之心而寓之酒也。',
  },
  {
    title: '兰亭集序（节选）- 王羲之',
    content: '永和九年，岁在癸丑，暮春之初，会于会稽山阴之兰亭，修禊事也。群贤毕至，少长咸集。此地有崇山峻岭，茂林修竹；又有清流激湍，映带左右，引以为流觞曲水，列坐其次。虽无丝竹管弦之盛，一觞一咏，亦足以畅叙幽情。是日也，天朗气清，惠风和畅，仰观宇宙之大，俯察品类之盛，所以游目骋怀，足以极视听之娱，信可乐也。',
  },
  {
    title: '静夜思 - 李白',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
  }];

