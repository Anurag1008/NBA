package com.portal.backend.security.jwt;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.portal.backend.security.services.UserDetailsServiceImpl;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger loger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        loger.debug("=== AuthTokenFilter START ===");
        loger.debug("Request URL: {}", request.getRequestURL());
        loger.debug("Request Method: {}", request.getMethod());
        loger.debug("Authorization Header: {}", request.getHeader("Authorization"));

        try {
            String jwt = parseJwt(request);
            loger.debug("Parsed JWT: {}", jwt);

            if (jwt != null) {
                if (jwtUtils.validateJwtToken(jwt)) {
                    String email = jwtUtils.getEmailFromJwtToken(jwt);
                    loger.debug("JWT is valid. Email from token: {}", email);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    loger.debug("Loaded userDetails: username={}, authorities={}", 
                                 userDetails.getUsername(), userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    loger.debug("Authentication set in SecurityContextHolder");
                } else {
                    loger.warn("JWT validation failed");
                }
            } else {
                loger.debug("No JWT token found in request header");
            }

        } catch (JwtException e) {
            loger.error("JWT processing failed: {}", e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            loger.error("Invalid arguments while parsing JWT: {}", e.getMessage(), e);
        } catch (UsernameNotFoundException e) {
            loger.error("Unexpected error in AuthTokenFilter: {}", e.getMessage(), e);
        }

        logger.debug("=== AuthTokenFilter END ===");
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
