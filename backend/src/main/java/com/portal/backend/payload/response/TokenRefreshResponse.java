package com.portal.backend.payload.response;

import lombok.Data;
@Data
public class TokenRefreshResponse {
  private String accessToken;
  
  private String tokenType = "Bearer";
  public TokenRefreshResponse(String accessToken) {
    this.accessToken = accessToken;
   
  }
}