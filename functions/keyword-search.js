// 필요한 도구들 불러오기
const axios = require('axios');  // 웹사이트 내용을 가져오는 도구
const cheerio = require('cheerio');  // HTML을 분석하는 도구

// 서버리스 함수 시작
exports.handler = async function(event) {
  // 응답 헤더 설정 (기술적인 부분이니 걱정하지 마세요)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  // 사용자가 입력한 키워드 가져오기
  const keyword = event.queryStringParameters.keyword;
  
  // 키워드가 없으면 오류 메시지 반환
  if (!keyword) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '키워드를 입력해주세요' })
    };
  }
  
  try {
    // 1. 웹사이트 방문하기 (우리 대신 axios가 방문함)
    console.log(`"${keyword}" 키워드로 검색 시작`);
    
    // axios로 웹페이지 내용 가져오기
    const response = await axios.get(
      `https://postmate.waffle-gl.org/keyword?search=${encodeURIComponent(keyword)}`,
      {
        // 일반 브라우저처럼 보이게 하는 설정
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );
    
    // 2. HTML 파싱 (웹페이지 내용 분석하기)
    const $ = cheerio.load(response.data);
    
    // 3. 검색량 정보 찾기
    let searchVolume = 0;  // 검색량을 저장할 변수
    
    // ==== 여기서부터 실제 사이트에 맞게 수정해야 함 ====
    
    // 방법 1: 클래스/ID로 찾기
    // 실제 요소의 클래스나 ID로 변경해야 합니다 (위 단계 1에서 확인한 정보)
    const volumeElement = $('.search-volume');  // '.search-volume'을 실제 클래스명으로 변경
    
    if (volumeElement.length) {
      // 요소를 찾았다면 텍스트 내용 가져오기
      const text = volumeElement.text();
      console.log(`찾은 텍스트: "${text}"`);
      
      // 숫자만 추출하기 (정규식 이용)
      const match = text.match(/[0-9,]+/);
      if (match) {
        // 쉼표 제거하고 숫자로 변환
        searchVolume = parseInt(match[0].replace(/,/g, ''));
      }
    }
    
    // 방법 2: 텍스트 내용으로 찾기
    if (searchVolume === 0) {
      // '월간 검색량'이라는 텍스트가 포함된 모든 요소 찾기
      $('*:contains("월간 검색량")').each(function() {
        const text = $(this).text();
        console.log(`검색량 관련 텍스트: "${text}"`);
        
        // "월간 검색량: 1,200회" 같은 패턴에서 숫자 추출
        const match = text.match(/월간 검색량[:\s]*([0-9,]+)/);
        if (match && match[1]) {
          searchVolume = parseInt(match[1].replace(/,/g, ''));
        }
      });
    }
    
    // 방법 3: 테이블에서 찾기
    if (searchVolume === 0) {
      // 테이블의 모든 행 확인
      $('table tr').each(function() {
        const rowText = $(this).text();
        
        // '검색량' 단어가 포함된 행 찾기
        if (rowText.includes('검색량') || rowText.includes('조회수')) {
          // 해당 행의 모든 셀 가져오기
          const cells = $(this).find('td');
          
          // 마지막 셀(값이 있는 셀)의 텍스트 가져오기
          if (cells.length > 0) {
            const valueText = $(cells[cells.length - 1]).text().trim();
            // 숫자만 추출
            const numericValue = valueText.replace(/[^0-9]/g, '');
            if (numericValue) {
              searchVolume = parseInt(numericValue);
            }
          }
        }
      });
    }
    
    // 4. 결과 확인 및 반환
    if (searchVolume > 0) {
      // 검색량을 성공적으로 찾았을 때
      console.log(`"${keyword}" 키워드의 검색량: ${searchVolume}회`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          keyword: keyword,
          totalViews: searchVolume
        })
      };
    } else {
      // 검색량을 찾지 못했을 때
      console.log(`"${keyword}" 키워드의 검색량을 찾지 못했습니다.`);
      console.log(`페이지 HTML 일부: ${$.html().substring(0, 300)}...`);
      
      // 임시 데이터 생성
      const tempVolume = Math.floor(Math.random() * 1000) + 100;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          keyword: keyword,
          totalViews: tempVolume,
          note: "실제 데이터를 찾지 못해 임시 데이터를 제공합니다"
        })
      };
    }
    
  } catch (error) {
    // 오류 발생 시
    console.log(`오류 발생:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '데이터 조회 중 오류가 발생했습니다',
        details: error.message
      })
    };
  }
};
