package com.portal.backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.ERole;
import com.portal.backend.entity.RefreshToken;
import com.portal.backend.entity.Roles;
import com.portal.backend.entity.Users;
import com.portal.backend.exception.TokenRefreshException;
import com.portal.backend.payload.request.CreateMultipleUserRequest;
import com.portal.backend.payload.request.LoginRequest;
import com.portal.backend.payload.request.SignupRequest;
import com.portal.backend.payload.request.UpdateUserRole;
import com.portal.backend.payload.response.JwtResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.payload.response.TokenRefreshResponse;
import com.portal.backend.repository.RoleRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.jwt.JwtUtils;
import com.portal.backend.security.services.RefreshTokenService;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {
  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;

  @Autowired
  RoleRepository roleRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @Autowired
  RefreshTokenService refreshTokenService;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
      HttpServletResponse response) {

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

    SecurityContextHolder.getContext().setAuthentication(authentication);

    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

    // Generate short-lived Access Token
    String jwt = jwtUtils.generateJwtToken(userDetails);

    // Generate long-lived Refresh Token (random UUID stored in DB)
    RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

    // Send Refresh Token as HttpOnly cookie
    ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
        .httpOnly(true)
        // .secure(true) // use HTTPS in production
        .secure(false)
        .path("/") // refresh endpoint
        // .path("/")
        .maxAge(7 * 24 * 60 * 60) // e.g., 7 days
        // .sameSite("Strict")
        .sameSite("Lax")
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    // Return only access token + user info in body
    return ResponseEntity.ok(new JwtResponse(jwt));
  }

  // @PostMapping("/signin")
  // public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest
  // loginRequest) {

  // Authentication authentication = authenticationManager
  // .authenticate(new
  // UsernamePasswordAuthenticationToken(loginRequest.getEmail(),
  // loginRequest.getPassword()));

  // SecurityContextHolder.getContext().setAuthentication(authentication);

  // UserDetailsImpl userDetails = (UserDetailsImpl)
  // authentication.getPrincipal();

  // String jwt = jwtUtils.generateJwtToken(userDetails);

  // RefreshToken refreshToken =
  // refreshTokenService.createRefreshToken(userDetails.getId());

  // return ResponseEntity.ok(new JwtResponse(jwt, refreshToken.getToken()));
  // }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {

    // check wheather login in user that creating a new user is admin or not
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    UserDetailsImpl loggedInUser = (UserDetailsImpl) auth.getPrincipal();
    if (!loggedInUser.getRoles().contains("ROLE_ADMIN")) {
      return ResponseEntity.status(403).body(new MessageResponse("Error: Only ADMIN can create new users!"));
    }

    if (userRepository.existsByUsername(signUpRequest.getUsername())) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
    }

    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
    }
    // Create new user's account
    Users user = new Users(signUpRequest.getUsername(), signUpRequest.getEmail(),
        encoder.encode(signUpRequest.getPassword()));

    Set<String> strRoles = signUpRequest.getRole();
    List<Roles> roles = new ArrayList<>();

    if (strRoles == null) {
      // logger.info("No roles specified during signup. Assigning default role
      // ROLE_FACULTY.");
      Roles userRole = roleRepository.findByName(ERole.ROLE_FACULTY)
          .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
      roles.add(userRole);
      // logger.info("Default role ROLE_FACULTY assigned to the user.");
    } else {
      strRoles.forEach(role -> {
        Roles resolvedRole = switch (role) {
          case "admin" -> roleRepository.findByName(ERole.ROLE_ADMIN)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
          case "principle" -> roleRepository.findByName(ERole.ROLE_PRINCIPAL)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
          default -> roleRepository.findByName(ERole.ROLE_FACULTY)
              .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        };
        roles.add(resolvedRole);
      });
    }

    user.setRoles(roles);
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
  }

  @PostMapping("/create-Multiple-Users")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> createMultipleUsers(@Valid @RequestBody CreateMultipleUserRequest request) {
    // check wheather login in user that creating a new user is admin or not
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    UserDetailsImpl loggedInUser = (UserDetailsImpl) auth.getPrincipal();
    if (!loggedInUser.getRoles().contains("ROLE_ADMIN")) {
      return ResponseEntity.status(403).body(new MessageResponse("Error: Only ADMIN can create new users!"));
    }
    List<String> userEmails = request.getUser_email();
    for (String email : userEmails) {
      if (userRepository.existsByEmail(email)) {
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Email " + email + " is already in use!"));
      }
      String username = email.split("@")[0];
      if (userRepository.existsByUsername(username)) {
        username = username + System.currentTimeMillis();
      }
      String defaultPassword = "Default@123"; // You can set a more secure default password or generate one
      Users user = new Users(username, email, encoder.encode(defaultPassword));
      List<Roles> roles = new ArrayList<>();
      Roles userRole = roleRepository.findByName(ERole.ROLE_FACULTY)
          .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
      roles.add(userRole);
      user.setRoles(roles);
      userRepository.save(user);
    }
    return ResponseEntity.ok(new MessageResponse("Users registered successfully!"));
  }

  @PostMapping("/update-user-role")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> updateUserRole(@Valid @RequestBody UpdateUserRole updateRole) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    UserDetailsImpl loggedInUser = (UserDetailsImpl) auth.getPrincipal();
    if (!loggedInUser.getRoles().contains("ROLE_ADMIN")) {
      return ResponseEntity.status(403).body(new MessageResponse("Error: Only ADMIN can create new users!"));
    }

    String userEmail = updateRole.getEmail();
    if (!userRepository.existsByEmail(userEmail)) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Email " + userEmail + " user with this email is not present !"));
    }

    Users user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Error: User with email " + userEmail + " not found!"));

    Set<String> assignRole = updateRole.getRoles();
    List<Roles> roles = new ArrayList<>();
    assignRole.forEach(role -> {
      Roles resolvedRole = switch (role) {
        case "admin" -> roleRepository.findByName(ERole.ROLE_ADMIN)
            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        case "principle" -> roleRepository.findByName(ERole.ROLE_PRINCIPAL)
            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        case "hod" -> roleRepository.findByName(ERole.ROLE_HOD)
            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        default -> roleRepository.findByName(ERole.ROLE_FACULTY)
            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
      };
      roles.add(resolvedRole);
    });
    // current roles will be deleted.
    user.setRoles(roles);
    userRepository.save(user);
    return ResponseEntity.ok(new MessageResponse("Users role updated successfully!"));
  }

  @GetMapping("/refreshtoken")
  public ResponseEntity<?> refreshtoken(
      @CookieValue(name = "refreshToken", required = false) String requestRefreshToken,
      HttpServletResponse response) {
    if (requestRefreshToken == null) {
      throw new TokenRefreshException(null, "Refresh token is missing in cookie!");
    }

    return refreshTokenService.findByToken(requestRefreshToken)
        .map(refreshTokenService::verifyExpiration)
        .map(RefreshToken::getUser)
        .map(user -> {
          // ✅ Generate new access token
          String accessToken = jwtUtils.generateTokenFromUserDetails(
              user.getEmail(),
              user.getId(),
              user.getRoles().stream()
                  .map(role -> role.getName().name())
                  .collect(Collectors.toList()));

          // (Optional) Rotate refresh token (invalidate old + issue new one)
          RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
          ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken.getToken())
              .httpOnly(true)
              // .secure(true) for production
              .secure(false)
              .path("/")
              // .path("/")
              .maxAge(7 * 24 * 60 * 60)
              .sameSite("Lax")
              // .sameSite("Strict")
              .build();
          response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

          return ResponseEntity.ok(new TokenRefreshResponse(accessToken));
        })
        .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
            "Refresh token is not in database!"));
  }

  // @GetMapping("/refreshtoken")
  // public ResponseEntity<?> refreshtoken(@Valid @RequestBody TokenRefreshRequest
  // request) {
  // String requestRefreshToken = request.getRefreshToken();

  // return refreshTokenService.findByToken(requestRefreshToken)
  // .map(refreshTokenService::verifyExpiration)
  // .map(RefreshToken::getUser)
  // .map(user -> {
  // String token = jwtUtils.generateTokenFromUserDetails(user.getEmail(),
  // user.getId(),
  // user.getRoles().stream()
  // .map(role -> role.getName().name())
  // .collect(Collectors.toList()));
  // return ResponseEntity.ok(new TokenRefreshResponse(token,
  // requestRefreshToken));
  // })
  // .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
  // "Refresh token is not in database!"));
  // }

  @PostMapping("/signout")
  public ResponseEntity<?> logoutUser() {
    UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
        .getPrincipal();
    Long userId = userDetails.getId();
    refreshTokenService.deleteByUserId(userId);
    return ResponseEntity.ok(new MessageResponse("Log out successful!"));
  }

}
