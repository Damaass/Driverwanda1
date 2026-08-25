const db = require('./db');
const bcrypt = require('bcryptjs');
const { randomInt } = require('crypto');

function generateRegistrationCode() {
  return 'REG' + randomInt(100000, 999999).toString();
}

console.log('Seeding database...');

// Clear existing data
db.prepare('DELETE FROM exam_sessions').run();
db.prepare('DELETE FROM questions').run();
db.prepare('DELETE FROM users').run();

// Create default user
const hashed = bcrypt.hashSync('test123', 10);
const adminHashed = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (names, email, password, phone, national_id, date_of_birth, role, registration_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  .run('Test User', 'test@rnp.rw', hashed, '0780000000', '1199000000000000', '1990-01-01', 'user', generateRegistrationCode(), 'active');
db.prepare('INSERT INTO users (names, email, password, phone, national_id, date_of_birth, role, registration_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  .run('Admin User', 'admin@rnp.rw', adminHashed, '0780000001', '1000000000000000', '1990-01-01', 'admin', generateRegistrationCode(), 'active');

console.log('Created default user: test@rnp.rw / test123');
console.log('Created admin user: admin@rnp.rw / admin123');

const insertQ = db.prepare(`
  INSERT INTO questions (question_rw, question_en, option_a_rw, option_b_rw, option_c_rw, option_d_rw,
    option_a_en, option_b_en, option_c_en, option_d_en, correct_answer, category, language, image_path)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const questions = [
  {
    rw: "Ikinyabiziga cyose cyangwa ibinyabiziga bigenda bigomba kugira:",
    en: "Every vehicle or vehicles in motion must have:",
    a_rw:"Umuyobozi", b_rw:"Umuherekeza", c_rw:"A na B ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"A driver", b_en:"An escort", c_en:"A and B are correct", d_en:"No correct answer",
    ans:"a", cat:"general"
  },
  {
    rw: "Ijambo 'akayira' bivuga inzira nyabagendwa ifunganye yagenewe gusa:",
    en: "The word 'akayira' means a narrow road designated only for:",
    a_rw:"Abanyamaguru", b_rw:"Ibinyabiziga bigendera ku biziga bibiri", c_rw:"A na B ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Pedestrians", b_en:"Two-wheeled vehicles", c_en:"A and B are correct", d_en:"No correct answer",
    ans:"c", cat:"general"
  },
  {
    rw: "Umurongo uciyemo uduce umenyesha ahegereye umurongo ushobora kuzuzwa n'uturanga gukata tw'ibara ryera utwo turanga cyerekezo tumenyesha:",
    en: "A broken line indicates approaching a continuous line where white markings show:",
    a_rw:"Igisate cy'umuhanda abayobozi bagomba gukurikira", b_rw:"Ahegereye umurongo ukomeje", c_rw:"Igabanurwa ry'umubare w'ibisate by'umuhanda mu cyerekezo bajyamo", d_rw:"A na C nibyo",
    a_en:"The lane drivers must follow", b_en:"Near a solid line", c_en:"Reduction of lanes in direction of travel", d_en:"A and C are correct",
    ans:"c", cat:"road_markings"
  },
  {
    rw: "Ahantu ho kugendera mu muhanda herekanwa n'ibimenyetso bimurika ibinyabiziga ntibishobora kuhagenda:",
    en: "A traffic-lit road section where vehicles cannot pass:",
    a_rw:"Biteganye", b_rw:"Ku murongo umwe", c_rw:"A na B nibyo", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Side by side", b_en:"Single file", c_en:"A and B", d_en:"No correct answer",
    ans:"d", cat:"traffic_lights"
  },
  {
    rw: "Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa buri mwaka:",
    en: "The following vehicles must be inspected every year:",
    a_rw:"Ibinyabiziga bigenewe gutwara abagenzi muri rusange", b_rw:"Ibinyabiziga bigenewe gutwara ibintu birengeje toni 3.5", c_rw:"Ibinyabiziga bigenewe kwigisha gutwara", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Vehicles for carrying passengers", b_en:"Vehicles for carrying goods over 3.5 tons", c_en:"Vehicles for driving lessons", d_en:"No correct answer",
    ans:"d", cat:"vehicle_inspection"
  },
  {
    rw: "Ahatari mu nsisiro umuvuduko ntarengwa mu isaha wa velomoteri ni:",
    en: "Outside built-up areas the maximum speed for a motorcycle is:",
    a_rw:"Km50", b_rw:"Km40", c_rw:"Km30", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"50 km/h", b_en:"40 km/h", c_en:"30 km/h", d_en:"No correct answer",
    ans:"a", cat:"speed"
  },
  {
    rw: "Ikinyabiziga kibujijwe guhagarara akanya kanini aha hakurikira:",
    en: "A vehicle is forbidden from stopping briefly in the following places:",
    a_rw:"Ahatarengeje metero 1 imbere cyangwa inyuma y'ikinyabiziga gihagaze akanya gato cyangwa kanini", b_rw:"Ahantu hari ibimenyetso bibuza byabugenewe", c_rw:"Aho abanyamaguru banyura mu muhanda ngo bakikire inkomyi", d_rw:"Ibisubizo byose nibyo",
    a_en:"Less than 1m in front/behind a stopped vehicle", b_en:"Where prohibition signs are posted", c_en:"Where pedestrians cross to reach a pedestrian island", d_en:"All answers are correct",
    ans:"d", cat:"stopping"
  },
  {
    rw: "Kunyuranaho bikorerwa:",
    en: "Overtaking is done:",
    a_rw:"Mu ruhande rw'iburyo gusa", b_rw:"Igihe cyose ni ibumoso", c_rw:"Iburyo iyo unyura ku nyamaswa", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"On the right side only", b_en:"Always on the left", c_en:"On the right when passing animals", d_en:"No correct answer",
    ans:"d", cat:"overtaking"
  },
  {
    rw: "Iyo nta mategeko awugabanya by'umwihariko umuvuduko ntarengwa ku modoka zitwara abagenzi mu buryo bwa rusange ni:",
    en: "When there are no specific regulations, the maximum speed for public passenger vehicles is:",
    a_rw:"Km 60 mu isaha", b_rw:"Km 40 mu isaha", c_rw:"Km 25 mu isaha", d_rw:"Km20 mu isaha",
    a_en:"60 km/h", b_en:"40 km/h", c_en:"25 km/h", d_en:"20 km/h",
    ans:"a", cat:"speed"
  },
  {
    rw: "Iyo nta mategeko awugabanya by'umwihariko, umuvuduko ntarengwa ku modoka zikoreshwa nk'amavatiri y'ifasi cyangwa amatagisi zifite uburemere bwemewe butarenga kilogarama 3500 ni:",
    en: "Without specific regulations, the max speed for taxis/hire vehicles under 3500kg is:",
    a_rw:"Km 60 mu isaha", b_rw:"Km 40 mu isaha", c_rw:"Km 75 mu isaha", d_rw:"Km20 mu isaha",
    a_en:"60 km/h", b_en:"40 km/h", c_en:"75 km/h", d_en:"20 km/h",
    ans:"c", cat:"speed"
  },
  {
    rw: "Nibura ikinyabiziga gitegetswe kugira uduhanagurakirahure tungahe:",
    en: "A vehicle is required to have at least how many wipers:",
    a_rw:"2", b_rw:"3", c_rw:"1", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"2", b_en:"3", c_en:"1", d_en:"No correct answer",
    ans:"c", cat:"vehicle_equipment"
  },
  {
    rw: "Amatara maremare y'ikinyabiziga agomba kuzimwa mu bihe bikurikira:",
    en: "High beam headlights must be switched off in the following situations:",
    a_rw:"Iyo umuhanda umurikiye umuyobozi abasha kureba muri metero 20", b_rw:"Iyo ikinyabiziga kigiye kubisikana n'ibindi", c_rw:"Iyo ari mu nsisiro", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"When the road is lit and driver can see 20m", b_en:"When the vehicle is about to meet oncoming traffic", c_en:"When in a built-up area", d_en:"All answers correct",
    ans:"b", cat:"lights"
  },
  {
    rw: "Ikinyabiziga ntigishobora kugira amatara arenga abiri y'ubwoko bumwe keretse kubyerekeye amatara akurikira:",
    en: "A vehicle cannot have more than 2 lights of the same type except for:",
    a_rw:"Itara ndangamubyimba", b_rw:"Itara ryerekana icyerekezo", c_rw:"Itara ndangaburumbarare", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"Fog light", b_en:"Direction indicator", c_en:"Side marker light", d_en:"All are correct",
    ans:"d", cat:"lights"
  },
  {
    rw: "Uburyo bukoreshwa kugirango ikinyabiziga kigende gahoro igihe feri idakora neza babwita:",
    en: "The method used to slow a vehicle when service brakes fail is called:",
    a_rw:"Feri y'urugendo", b_rw:"Feri yo guhagarara umwanya munini", c_rw:"Feri yo gutabara", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Service brake", b_en:"Parking brake", c_en:"Emergency brake", d_en:"No correct answer",
    ans:"c", cat:"brakes"
  },
  {
    rw: "Iyo nta mategeko awugabanya by'umwihariko umuvuduko ntarengwa w'amapikipiki mu isaha ni:",
    en: "Without specific regulations, the maximum speed for motorcycles is:",
    a_rw:"Km25", b_rw:"Km70", c_rw:"Km40", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"25 km/h", b_en:"70 km/h", c_en:"40 km/h", d_en:"No correct answer",
    ans:"d", cat:"speed"
  },
  {
    rw: "Iyo hatarimo indi myanya birabujijwe gutwara ku ntebe y'imbere y'imodoka abana badafite imyaka:",
    en: "When there are no other seats, it is forbidden to carry in the front seat children under:",
    a_rw:"Imyaka 10", b_rw:"Imyaka 12", c_rw:"Imyaka 7", d_rw:"Ntagisubizo cy'ukuri kirimo",
    a_en:"10 years", b_en:"12 years", c_en:"7 years", d_en:"No correct answer",
    ans:"b", cat:"passengers"
  },
  {
    rw: "Ni ryari itegeko rigenga gutambuka mbere kw'iburyo rikurikizwa mu masangano:",
    en: "When does the right-of-way rule apply at intersections:",
    a_rw:"Iyo nta cyapa cyo gutambuka mbere gihari", b_rw:"Iyo ikimenyetso kimurika cyagenewe ibinyabiziga kidakora", c_rw:"A na B ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"When there is no priority sign", b_en:"When traffic lights for vehicles are not working", c_en:"A and B are correct", d_en:"No correct answer",
    ans:"c", cat:"priority"
  },
  {
    rw: "Ibimenyetso bimurika byerekana uburyo bwo kugendera mu muhanda kw'ibinyabiziga bishyirwa iburyo bw'umuhanda. Ariko bishobora no gushyirwa ibumoso cyangwa hejuru y'umuhanda:",
    en: "Traffic signals are placed on the right side of the road but can also be on the left or above:",
    a_rw:"Hakurikijwe icyerekezo abagenzi bireba baganamo", b_rw:"Hakurikijwe icyo ibyo bimenyetso bigamije kwerekana", c_rw:"Kugirango birusheho kugaragara neza", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"Based on the direction travelers are going", b_en:"Based on what the signals intend to show", c_en:"To be more visible", d_en:"All correct",
    ans:"c", cat:"traffic_signs"
  },
  {
    rw: "Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa rimwe mu mezi 6:",
    en: "The following vehicles must be inspected once every 6 months:",
    a_rw:"Ibinyabiziga bitwara abagenzi muri rusange", b_rw:"Ibinyabiziga bigenewe gutwara ibintu birengeje toni 3.5", c_rw:"Ibinyabiziga bigenewe kwigisha gutwara", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"Public passenger vehicles", b_en:"Goods vehicles over 3.5 tons", c_en:"Driving school vehicles", d_en:"All are correct",
    ans:"d", cat:"vehicle_inspection"
  },
  {
    rw: "Iyo kuyobya umuhanda ari ngombwa bigaragazwa kuva aho uhera no kuburebure bwawo n'icyapa gifite ubuso bw'amabara akurikira:",
    en: "When road diversion is necessary, it is shown from start with a sign of this background color:",
    a_rw:"Ubururu", b_rw:"Umweru", c_rw:"Umutuku", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"Blue", b_en:"White", c_en:"Red", d_en:"No correct answer",
    ans:"a", cat:"traffic_signs"
  },
  {
    rw: "Ku mihanda ibyapa bikurikira bigomba kugaragazwa ku buryo bumwe:",
    en: "On roads, the following signs must be displayed uniformly:",
    a_rw:"Ibyapa biyobora n'ibitegeka", b_rw:"Ibyapa biburira n'ibitegeka", c_rw:"Ibyapa bibuza n'ibitegeka", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Direction and obligation signs", b_en:"Warning and obligation signs", c_en:"Prohibition and obligation signs", d_en:"No correct answer",
    ans:"c", cat:"traffic_signs"
  },
  {
    rw: "Ni iyihe feri ituma imodoka igenda buhoro kandi igahagarara ku buryo bwizewe bubangutse:",
    en: "Which brake allows the vehicle to slow and stop reliably and quickly:",
    a_rw:"Feri y'urugendo", b_rw:"Feri yo gutabara", c_rw:"Feri yo guhagarara umwanya munini", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Service brake", b_en:"Emergency brake", c_en:"Parking brake", d_en:"No correct answer",
    ans:"a", cat:"brakes"
  },
  {
    rw: "Uretse mu mujyi, ku yindi mihanda yajyenwe na minisitiri ushinzwe gutwara abantu n'ibintu, uburemere ntarengwa ku binyabiziga bifite imitambiko itatu cyangwa irenga hatarimo makuzungu ni:",
    en: "Outside cities, on roads designated by the minister, the max weight for vehicles with 3+ axles (excl. articulated) is:",
    a_rw:"Toni 10", b_rw:"Toni 12", c_rw:"Toni 16", d_rw:"Toni 24",
    a_en:"10 tons", b_en:"12 tons", c_en:"16 tons", d_en:"24 tons",
    ans:"c", cat:"vehicle_weight"
  },
  {
    rw: "Mu gihe telefone yawe ihamagawe utwaye imodoka wakora iki?",
    en: "When your phone rings while driving, what should you do?",
    a_rw:"Kwitaba cyangwa guhagarara ako kanya", b_rw:"Kutayitaba", c_rw:"Gushyira imodoka iruhande ukayitaba", d_rw:"B na c ni ibisubizo byukuri",
    a_en:"Answer or stop immediately", b_en:"Ignore it", c_en:"Pull over and answer", d_en:"B and C are correct",
    ans:"c", cat:"safety"
  },
  {
    rw: "Niki wakora mbere y'uko uhindura icyerekezo?",
    en: "What should you do before changing direction?",
    a_rw:"Gutanga ikimenyetso cy'ukuboko no gukoresha amatara ndangacyerekezo", b_rw:"Itegereze neza niba icyapa kikwemerera guhindura icyerekezo", c_rw:"A na B n'ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Signal with hand and use indicators", b_en:"Check if a sign allows you to change direction", c_en:"A and B are correct", d_en:"No correct answer",
    ans:"c", cat:"safety"
  },
  {
    rw: "Niki wakora mugihe usanze mu bimenyetso bimurika harimo ibara ry'umuhondo?",
    en: "What do you do when you see a yellow traffic light?",
    a_rw:"Kongera umuvuduko", b_rw:"Kugumana umuvuduko wari uriho", c_rw:"Kwitegura guhagarara", d_rw:"Gufata feri cyane",
    a_en:"Increase speed", b_en:"Maintain current speed", c_en:"Prepare to stop", d_en:"Brake hard",
    ans:"c", cat:"traffic_lights"
  },
  {
    rw: "Mubimenyetso bimurika itara ritukura rivuga iki?",
    en: "What does a red traffic light mean?",
    a_rw:"Hagarara kereste niba ushaka gukata ibumoso", b_rw:"Hagarara niba ubona ntabyago byaguteza", c_rw:"Birabujijwe kurenga icyo kimenyetso", d_rw:"Wemerewe kugenda niba aho asohokera mu masangano y'umuhanda hafunze",
    a_en:"Stop unless turning left", b_en:"Stop if you see danger", c_en:"You are forbidden to cross that signal", d_en:"You may go if the intersection exit is blocked",
    ans:"c", cat:"traffic_lights"
  },
  {
    rw: "Mubimenyetso bimurika itara ry'umuhondo risobanura iki?",
    en: "What does a yellow traffic light mean?",
    a_rw:"Itegure kugenda", b_rw:"Birabujijwe gutambuka umurongo wo guhagarara umwanya muto cg igihe uwo murongo udahari icyo kimenyetso ubwacyo", c_rw:"A na b ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Prepare to go", b_en:"Forbidden to cross stop line or signal itself", c_en:"A and B correct", d_en:"No correct answer",
    ans:"b", cat:"traffic_lights"
  },
  {
    rw: "Mubimenyetso bimurika itara ry'icyatsi risobanura iki?",
    en: "What does a green traffic light mean?",
    a_rw:"Kwitegura kugenda", b_rw:"Uburenganzira bwo kurenga icyo kimenyetso", c_rw:"Hagarara niba inzira isohoka mu isangano ry'imihanda ifunze", d_rw:"Ntagisubizo cyukuri kirimo",
    a_en:"Prepare to go", b_en:"Permission to cross that signal", c_en:"Stop if intersection exit is blocked", d_en:"No correct answer",
    ans:"b", cat:"traffic_lights"
  },
  {
    rw: "Umurongo ucagaguye wera mu muhanda usobanura iki?",
    en: "What does a dashed white line on the road mean?",
    a_rw:"Birabujijwe kuwurenga", b_rw:"Birabujijwe kuhahagarara", c_rw:"Wegereye ahaguteza ibyago", d_rw:"Kunyuranaho ntibyemewe",
    a_en:"Forbidden to cross", b_en:"Forbidden to stop here", c_en:"Approaching a danger zone", d_en:"Overtaking not allowed",
    ans:"a", cat:"road_markings"
  },
  {
    rw: "Wegereye inzira y'abanyamaguru ugasanga bategereje kwambuka. Ugomba gukora iki?",
    en: "You approach a pedestrian crossing where people are waiting. What must you do?",
    a_rw:"Kureka abakuze n'abafite ubumuga bagatambuka mbere", b_rw:"Kugabanya umuvuduko witegura guhagarara", c_rw:"Gukoresha amatara abamenyesha kwambuka", d_rw:"Gukoresha ibimenyetso byamaboko bibemerera kwambuka",
    a_en:"Let elderly and disabled cross first", b_en:"Reduce speed and prepare to stop", c_en:"Flash lights to signal them to cross", d_en:"Use hand signals to allow crossing",
    ans:"b", cat:"pedestrians"
  },
  {
    rw: "Mu gihe cy'impanuka mu muhanda n'ubundi bushotoranyi ni yihe nimero ya telefone y'ubutabazi wahamagara?",
    en: "In case of a road accident or emergency, which emergency number should you call?",
    a_rw:"911", b_rw:"100", c_rw:"112", d_rw:"131",
    a_en:"911", b_en:"100", c_en:"112", d_en:"131",
    ans:"c", cat:"emergency"
  },
  {
    rw: "Ugeze bwa mbere ahabereye impanuka yo mu muhanda harimo inkomere wakora iki?",
    en: "You are the first to arrive at a road accident with injuries, what should you do?",
    a_rw:"Gusohora inkomere mu kinyabiziga", b_rw:"Kubaha icyo kunywa", c_rw:"Ku menyesha impanuka no guhamagara ubutabazi", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"Remove injured from vehicle", b_en:"Give them something to drink", c_en:"Report the accident and call emergency services", d_en:"No correct answer",
    ans:"c", cat:"emergency"
  },
  {
    rw: "Ni ikihe cyapa gisobanura umuhanda w'icyerekezo kimwe?",
    en: "Which sign indicates a one-way road?",
    a_rw:"Icyapa D1a", b_rw:"Icyapa E13a", c_rw:"Icyapa C19", d_rw:"Icyapa C1",
    a_en:"Sign D1a", b_en:"Sign E13a", c_en:"Sign C19", d_en:"Sign C1",
    ans:"b", cat:"traffic_signs"
  },
  {
    rw: "Ibyapa bibuza n'ibitegeka bikurikizwa gusa:",
    en: "Prohibition and obligation signs apply only:",
    a_rw:"Mumasangano", b_rw:"Mu bimenyetso bimurika", c_rw:"A na b ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"At intersections", b_en:"At traffic lights", c_en:"A and B correct", d_en:"No correct answer",
    ans:"d", cat:"traffic_signs"
  },
  {
    rw: "Gutwara ikinyabiziga wasinze birabujijwe ku binyabiziga:",
    en: "Driving a vehicle while sleepy is forbidden for:",
    a_rw:"Biremewe kubinyabiziga byabikorera kugiti cyabo", b_rw:"Biremewe nijoro", c_rw:"Birabujijwe ku binyabiziga byose bifite moteri", d_rw:"Ibisubizo byose nibyo",
    a_en:"Allowed for private vehicles", b_en:"Allowed at night", c_en:"Forbidden for all motorized vehicles", d_en:"All correct",
    ans:"c", cat:"safety"
  },
  {
    rw: "Ntibyemewe gukoresha telephone:",
    en: "It is not allowed to use a mobile phone:",
    a_rw:"Mu biro bya leta", b_rw:"Mu biro bya Polisi", c_rw:"Igihe utwaye ikinyabiziga", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"In government offices", b_en:"In police offices", c_en:"While driving a vehicle", d_en:"All correct",
    ans:"c", cat:"safety"
  },
  {
    rw: "Icyapa gikozwe mw'ishusho ya mpandeshatu kimenyesha:",
    en: "A triangular-shaped sign indicates:",
    a_rw:"Ibyago", b_rw:"Ibibujijwe", c_rw:"Ibitegetswe", d_rw:"Ntagisubizo cy'ukuri kirimo",
    a_en:"Danger/warning", b_en:"Prohibition", c_en:"Obligation", d_en:"No correct answer",
    ans:"a", cat:"traffic_signs"
  },
  {
    rw: "Ibyapa biburira bibereyeho kumenyesha umugenzi:",
    en: "Warning signs are designed to inform the driver of:",
    a_rw:"Ko hari icyago", b_rw:"Icyago kidasobanuye ukundi", c_rw:"Imiterere y'icyago gitunguranye", d_rw:"Nta gisubizo cy'ukuri kirimo",
    a_en:"That there is danger ahead", b_en:"Unexplained danger", c_en:"Nature of sudden danger", d_en:"No correct answer",
    ans:"a", cat:"traffic_signs"
  },
  {
    rw: "Amatara ndangacyerekezo agomba kugaragara nijoro igihe ijuru rikeye mu ntera nibura ya:",
    en: "Direction indicators must be visible at night in clear weather at minimum:",
    a_rw:"m 100", b_rw:"m 200", c_rw:"m150", d_rw:"m250",
    a_en:"100m", b_en:"200m", c_en:"150m", d_en:"250m",
    ans:"c", cat:"lights"
  },
  {
    rw: "Umurongo ucagaguye uvuga ko buri muyobozi abujijwe kuwurenga uretse mu gihe:",
    en: "A dashed line means every driver is forbidden to cross it except when:",
    a_rw:"Agomba kunyura ku kindi kinyabiziga", b_rw:"Gukatira ibumoso", c_rw:"Guhindukira cyangwa kujya mukindi gice cy'umuhanda", d_rw:"Ibi bisubizo byose nibyo",
    a_en:"Overtaking another vehicle", b_en:"Turning left", c_en:"Turning around or changing lane", d_en:"All of these",
    ans:"d", cat:"road_markings"
  },
  {
    rw: "Iyo ubugari bw'inzira nyabagendwa igenderwamo n'ibinyabiziga budahagije kugirango bibisikane nta nkomyi abagenzi bategetswe:",
    en: "When the road is too narrow for vehicles to pass without an island, drivers must:",
    a_rw:"Kunyura mu nzira z'impande z'abanyamaguru", b_rw:"Guhagarara aho bageze", c_rw:"Koroherana", d_rw:"Gukuraho inkomyi",
    a_en:"Use pedestrian paths", b_en:"Stop where they are", c_en:"Give way to each other", d_en:"Remove the island",
    ans:"c", cat:"general"
  },
  {
    rw: "Ni iki gikenewe muri ibi bikurikira kugirango ubashe gutwara imodoka mu muhanda biteganywa nitegeko?",
    en: "What is required to legally drive a vehicle on the road?",
    a_rw:"Uruhushya rwa burundu rwo gutwara ibinyabiziga rugifite agaciro", b_rw:"Ubwishingizi bw'ikinyabizaga bugifite agaciro", c_rw:"Icyemezo cy'iyandikwa ry'ikinyabiziga", d_rw:"Ibisubizo byose nibyo",
    a_en:"Valid full driving licence", b_en:"Valid vehicle insurance", c_en:"Vehicle registration certificate", d_en:"All of the above",
    ans:"d", cat:"documents"
  },
  {
    rw: "Ikinyabiziga gishya gikenerwa gusuzumwa bwambere nyuma y'igihe kingana iki?",
    en: "A new vehicle must have its first inspection after:",
    a_rw:"Nyuma y'umwaka umwe", b_rw:"Nyuma y'imyaka ibiri", c_rw:"A na b ni ibisubizo by'ukuri", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"After one year", b_en:"After two years", c_en:"A and B correct", d_en:"No correct answer",
    ans:"b", cat:"vehicle_inspection"
  },
  {
    rw: "Ni ryari ushobora kwakiriza icyarimwe amatara yose ndangacyerekezo y'ikinyabiziga?",
    en: "When can you activate all direction indicators simultaneously?",
    a_rw:"Mu gihe ushaka kuburira abandi bakoresha umuhanda", b_rw:"Mu gihe ikinyabiziga cyawe gishobora guteza ibyago", c_rw:"A na b ni ibisubizo by'ukuri", d_rw:"Ntagisubizo cy'ukuri",
    a_en:"When warning other road users", b_en:"When your vehicle may cause danger", c_en:"A and B correct", d_en:"No correct answer",
    ans:"c", cat:"lights"
  },
  {
    rw: "Igihe ikinyabiziga cyacu bakinyuzeho tugomba:",
    en: "When another vehicle overtakes us we must:",
    a_rw:"Tugomba kugabanya umuvuduko", b_rw:"Tugomba kongera umuvuduko", c_rw:"Tugomba kongera umuvuduko n'ubwitonzi", d_rw:"Nta gisubizo cy' ukuri kirimo",
    a_en:"Reduce speed", b_en:"Increase speed", c_en:"Increase speed carefully", d_en:"No correct answer",
    ans:"a", cat:"overtaking"
  },
  {
    rw: "Mbere yo kunyura ku kindi kinyabiziga, ni ngombwa kumenya ko:",
    en: "Before overtaking another vehicle, it is necessary to know that:",
    a_rw:"Nta kindi kinyabiziga kinturutse inyuma", b_rw:"Umuhanda ubona neza, no kwitondera kunyuranaho", c_rw:"Ikinyabiziga kinturutse imbere gishaka gukatira I buumoso", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"No vehicle is coming from behind", b_en:"The road is clear and overtaking is safe", c_en:"The vehicle ahead wants to turn left", d_en:"No correct answer",
    ans:"b", cat:"overtaking"
  },
  {
    rw: "Icyemezo cy'Isuzuma ry'ikinyabiziga kimara igihe kingana iki?",
    en: "How long is a vehicle inspection certificate valid?",
    a_rw:"Amezi 6 kubinyabiziga bikora ubucuruzi", b_rw:"Amezi 12 ku binyabiziga bidakora ubucuruzi", c_rw:"Imyaka 2", d_rw:"A na B ni ibisubizo by'ukuri",
    a_en:"6 months for commercial vehicles", b_en:"12 months for non-commercial vehicles", c_en:"2 years", d_en:"A and B are correct",
    ans:"d", cat:"vehicle_inspection"
  },
  {
    rw: "Kuvuza ihoni bibujijwe:",
    en: "Sounding the horn is forbidden:",
    a_rw:"Ku musigiti, ku rusengero, ku rutambiro", b_rw:"Hafi y'ibitaro", c_rw:"Hafi y'ubuyobozi bwa polisi", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"Near mosques, churches, temples", b_en:"Near hospitals", c_en:"Near police stations", d_en:"No correct answer",
    ans:"b", cat:"horn"
  },
  {
    rw: "Guhagarara akanya gato no guhagarara akanya kanini bibujijwe cyane cyane aha hakurikira:",
    en: "Brief and extended stopping are especially forbidden in the following places:",
    a_rw:"Ku mihanda y'icyerekezo kimwe hose", b_rw:"Mu ruhande ruteganye n'urwo ikindi kinyabiziga gihagazemo akanya gato cyangwa kanini", c_rw:"Ku mihanda ibisikanirwamo, iyo ubugari bw'umwanya w'ibinyabiziga ugomba gutuma bibisikana butagifite m12", d_rw:"Ibisubizo byose nibyo",
    a_en:"On all one-way roads", b_en:"Alongside another stopped vehicle", c_en:"On two-way roads when space for passing drops below 12m", d_en:"All correct",
    ans:"b", cat:"stopping"
  },
  {
    rw: "N'iyihe myifatire myiza wagira ugeze aho abana bari hafi y'inzira nyabagendwa?",
    en: "What is the best behavior when approaching children near the road?",
    a_rw:"Itonde, witegereze ni biba ngongwa ubaburire unitegura kuba wahagarara", b_rw:"Ihute urenge aho abo bana bari", c_rw:"Komeza ugume ku muvuduko munini", d_rw:"Komeza ugendere kuruhande rw'iburyo",
    a_en:"Be alert, watch and if needed warn them, prepare to stop", b_en:"Speed up past where the children are", c_en:"Continue at high speed", d_en:"Continue on the right side",
    ans:"a", cat:"pedestrians"
  },
  {
    rw: "Igihe za otobisi zigenewe gutwara banyeshuli zihagaze kugirango zibafate cyangwa bavemo ugomba:",
    en: "When school buses have stopped to pick up or drop off students you must:",
    a_rw:"Kuvuza ihoni ugakomeza", b_rw:"Gukomeza ugabanyije umuvuduko n'ubwitonzi kuko bishoboka ko abanyeshuli bakwambuka bitunguranye", c_rw:"Nta bwitonzi budasnzwe bukenewe", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"Honk and continue", b_en:"Continue with reduced speed carefully as students may cross unexpectedly", c_en:"No special care needed", d_en:"All correct",
    ans:"b", cat:"pedestrians"
  },
  {
    rw: "Amatara y'urugendo, mu gihe cy'ibihu:",
    en: "Driving lights in foggy conditions:",
    a_rw:"Ni meza kuko atuma ureba kure", b_rw:"Ni mabi kuko arakugarukira akaguhuma amaso", c_rw:"Akwizeza ko abandi bakubona", d_rw:"Nta gisubizo cy'ukuri",
    a_en:"Are good because they help you see far", b_en:"Are bad because they reflect back and blind you", c_en:"Help others see you", d_en:"No correct answer",
    ans:"b", cat:"lights"
  },
  {
    rw: "Ni iki umuyobozi w'ikinyabiziga yakora abonye otobisi iri kuva aho zagenewe guhagararwamo?",
    en: "What should a driver do when they see a bus leaving its bus stop?",
    a_rw:"Gukomeza iruhande kuko ufite uburenganzira bwo gukomeza", b_rw:"Gabanya umuvuduko maze ureke ikomeze", c_rw:"Gerageza unyureho kugirango atagutinza", d_rw:"Menyesha umuyobozi wa otobisi aguhe inzira",
    a_en:"Continue because you have right of way", b_en:"Reduce speed and let it go", c_en:"Try to overtake so it doesn't delay you", d_en:"Signal the bus driver to give way",
    ans:"b", cat:"general"
  },
  {
    rw: "Niki ugomba gukora igihe uhagaze ku muhanda igihe cy'ibihu?",
    en: "What must you do when stopped on the road in foggy conditions?",
    a_rw:"Kureka amatara ndanga akaguma yaka", b_rw:"Kureka amatara yo kubisikana na kamena-bihu akaguma yaka", c_rw:"Kureka amatara yo kubisikana akaguma yaka", d_rw:"Kureka amatara y'urugendo akaguma yaka",
    a_en:"Keep hazard lights on", b_en:"Keep fog and hazard lights on", c_en:"Keep fog lights on", d_en:"Keep driving lights on",
    ans:"a", cat:"lights"
  },
  {
    rw: "Igihe umuyobozi w'inyamaswa, afite inyamaswa idatuje, asaba ko ibinyabiziga bihagarara:",
    en: "When an animal handler with a restless animal requests vehicles to stop:",
    a_rw:"Umuyobozi w'ikinyabiziga agomba guhagarara", b_rw:"Umuyobozi w'ikinyabizigaagomba kuvuza ihoni agukomeza", c_rw:"Umuyobozi w'ikinyabiziga agomba kugabanya umuvuduko", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"The driver must stop", b_en:"The driver must honk and continue", c_en:"The driver must reduce speed", d_en:"All correct",
    ans:"a", cat:"animals"
  },
  {
    rw: "Mu gihe Umuntu ufite ubumuga bwo kutabona yambuka umuhanda yitwaje inkoni yera y'abatabona:",
    en: "When a blind person crosses the road with a white cane:",
    a_rw:"Umuyobozi w'ikinyabiziga agomba gufata iyo nkoni nk'icyapa kimumenyesha ko agomba guhagarara", b_rw:"Vuza ihoni ukomeze", c_rw:"Gabanya nurangiza ukomeze witonze", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"The driver must treat the white cane as a stop signal", b_en:"Honk and continue", c_en:"Reduce speed then continue carefully", d_en:"All correct",
    ans:"a", cat:"pedestrians"
  },
  {
    rw: "Ibice by'umuhanda byera bigari biteganye n'umurongo ugabanya umuhanda mo, kabiri bisobanura:",
    en: "Wide white road markings parallel to the center line indicate:",
    a_rw:"Guhagara kw'ikinyabiziga", b_rw:"Aho abanyamaguru bambukira", c_rw:"Guha ubushobozi binyabiziga", d_rw:"Ibisubizo byose ni ukuri",
    a_en:"Vehicle stopping area", b_en:"Pedestrian crossing", c_en:"Vehicle acceleration area", d_en:"All correct",
    ans:"b", cat:"road_markings"
  },
  {
    rw: "Uturebanyuma dukoreshwa:",
    en: "Rear-view mirrors are used for:",
    a_rw:"Kwireba", b_rw:"Kugenzura ibigendera mu muhanda inyuma", c_rw:"Kureba abicaye inyuma", d_rw:"Ntagisubizo cy'ukuri",
    a_en:"Looking at yourself", b_en:"Monitoring traffic behind", c_en:"Seeing rear seat passengers", d_en:"No correct answer",
    ans:"b", cat:"vehicle_equipment"
  },
];

for (const q of questions) {
  insertQ.run(
    q.rw, q.en,
    q.a_rw, q.b_rw, q.c_rw, q.d_rw,
    q.a_en, q.b_en, q.c_en, q.d_en,
    q.ans, q.cat, 'rw', ''
  );
}

const count = db.prepare('SELECT COUNT(*) as c FROM questions').get();
console.log(`✅ Seeded ${count.c} questions successfully!`);
console.log('✅ Database ready. Run: npm start');
