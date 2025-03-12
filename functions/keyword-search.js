const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const keyword = event.queryStringParameters.keyword;
  if (!keyword) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '키워드를 입력해주세요' })
    };
  }

  try {
    // 가상 데이터를 반환합니다
    // Postmate 사이트 크롤링 구현은 사이트 구조 파악 후 업데이트 필요
    const volume = generateKeywordVolume(keyword);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        keyword: keyword,
        totalViews: volume
      })
    };
  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '데이터 조회 중 오류가 발생했습니다' })
    };
  }
};

// 키워드 특성에 따라 가상 검색량 생성
function generateKeywordVolume(keyword) {
  // 자주 검색되는 키워드 데이터베이스
  const popularKeywords = {
    "헬스": 85000, "pt": 45000, "운동": 120000, "다이어트": 95000,
    "헬스장": 65000, "피트니스": 38000, "홈트": 42000, "웨이트": 28000,
    "강남": 75000, "서초": 42000, "양재": 35000, "역삼": 38000,
    "양재역 헬스": 1020, "양재역 헬스장": 2200,
    "양재 헬스장": 570, "양재 PT": 360
  };

  // 정확히 일치하는 키워드 찾기
  if (popularKeywords[keyword]) {
    return popularKeywords[keyword];
  }
  
  // 유사 키워드 찾기
  for (const dbKeyword in popularKeywords) {
    if (keyword.includes(dbKeyword) || dbKeyword.includes(keyword)) {
      return Math.floor(popularKeywords[dbKeyword] * 0.7);
    }
  }
  
  // 길이에 따른 랜덤 생성
  const wordCount = keyword.split(/\s+/).length;
  if (wordCount === 1) {
    return Math.floor(Math.random() * 50000) + 5000;
  } else if (wordCount <= 3) {
    return Math.floor(Math.random() * 3000) + 500;
  } else {
    return Math.floor(Math.random() * 500) + 100;
  }
}