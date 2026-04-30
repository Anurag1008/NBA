package com.portal.backend.payload.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JwtResponse {
	private String accessToken;
	private String type = "Bearer";

	public JwtResponse(String accessToken) {
		this.accessToken = accessToken;
	}
}
